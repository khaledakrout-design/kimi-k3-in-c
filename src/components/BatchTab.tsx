import React, { useState } from 'react';
import { 
  Play, Copy, Check, Download, Terminal, HardDrive, Cpu, 
  Layers, Database, ArrowRight, Activity, FileCode, CheckCircle2 
} from 'lucide-react';
import { MemoryPresetId, GenerationStepResult } from '../types/k3';
import { K3_PRESETS, MODEL_CENSUS } from '../data/k3Presets';
import { tokenizeText, COMMON_VOCAB } from '../utils/k3Tokenizer';
import { Pcg32, simulateMoEStep, calculateMemoryPlan } from '../utils/k3Engine';

interface BatchTabProps {
  activePreset: MemoryPresetId;
  turboMode: boolean;
}

export const BatchTab: React.FC<BatchTabProps> = ({ activePreset, turboMode }) => {
  const preset = K3_PRESETS[activePreset];

  const [inputMode, setInputMode] = useState<'prompt' | 'ids'>('prompt');
  const [promptText, setPromptText] = useState('The capital of France is');
  const [tokenIdsInput, setTokenIdsInput] = useState('1008, 10484, 318, 15383, 387');
  const [genCount, setGenCount] = useState(8);
  const [incremental, setIncremental] = useState(true);
  const [selectedLayers, setSelectedLayers] = useState(93);
  const [stopIds, setStopIds] = useState('163585, 163586');

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsTrace, setStepsTrace] = useState<GenerationStepResult[]>([]);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [generatedIds, setGeneratedIds] = useState<number[]>([]);
  const [runJsonOutput, setRunJsonOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick preset commands matching README
  const loadExample = (ex: 'paris' | 'fibonacci' | 'ids_oracle') => {
    if (ex === 'paris') {
      setInputMode('prompt');
      setPromptText('The capital of France is');
      setGenCount(8);
    } else if (ex === 'fibonacci') {
      setInputMode('prompt');
      setPromptText('def fibonacci(n):');
      setGenCount(16);
    } else {
      setInputMode('ids');
      setTokenIdsInput('1008, 10484, 318, 15383, 387');
      setGenCount(8);
    }
  };

  const runBatchInference = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setStepsTrace([]);
    setGeneratedOutput('');
    setGeneratedIds([]);
    setRunJsonOutput(null);

    let promptIds: number[] = [];
    if (inputMode === 'prompt') {
      const tokens = tokenizeText(promptText);
      promptIds = tokens.map(t => t.id);
    } else {
      promptIds = tokenIdsInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    const rng = new Pcg32(42);
    const plan = calculateMemoryPlan(preset.trunkGb, preset.cacheGb, preset.ultraLowMemory);

    // Simulated token generation bank
    let continuationWords: { id: number; text: string }[] = [];
    if (promptText.toLowerCase().includes('capital of france') || promptIds.includes(15383)) {
      continuationWords = [
        { id: 17374, text: ' Paris' },
        { id: 13, text: '.' },
        { id: 1008, text: ' It' },
        { id: 387, text: ' is' },
        { id: 262, text: ' the' },
        { id: 749, text: ' largest' },
        { id: 2548, text: ' city' },
        { id: 318, text: ' of' }
      ];
    } else if (promptText.toLowerCase().includes('fibonacci')) {
      continuationWords = [
        { id: 220, text: '\n' },
        { id: 756, text: '    if' },
        { id: 1045, text: ' n' },
        { id: 2845, text: ' <=' },
        { id: 16, text: ' 1:' },
        { id: 220, text: '\n' },
        { id: 671, text: '        return' },
        { id: 1045, text: ' n' },
        { id: 220, text: '\n' },
        { id: 757, text: '    else:' },
        { id: 220, text: '\n' },
        { id: 671, text: '        return' },
        { id: 20829, text: ' fibonacci' },
        { id: 1045, text: '(n' },
        { id: 2846, text: '-1)' },
        { id: 10, text: ' +' }
      ];
    } else {
      continuationWords = [
        { id: 2494, text: ' computed' },
        { id: 1008, text: ' state' },
        { id: 387, text: ' carries' },
        { id: 6414, text: ' cache' },
        { id: 34918, text: ' locality' },
        { id: 13, text: '.' },
        { id: 17374, text: ' Paris' },
        { id: 163585, text: ' [EOS]' }
      ];
    }

    const stepsToRun = Math.min(genCount, continuationWords.length);
    const traceAccumulator: GenerationStepResult[] = [];
    const emittedIds: number[] = [];
    let textAccumulator = '';

    const stepInterval = turboMode ? 60 : 300;

    for (let step = 0; step < stepsToRun; step++) {
      setCurrentStep(step + 1);
      const activeMoE = simulateMoEStep(step, activePreset, rng);
      const nextWord = continuationWords[step % continuationWords.length];

      emittedIds.push(nextWord.id);
      textAccumulator += nextWord.text;
      setGeneratedOutput(textAccumulator);
      setGeneratedIds([...emittedIds]);

      const stepRecord: GenerationStepResult = {
        step: step + 1,
        tokenId: nextWord.id,
        tokenText: nextWord.text,
        isThinking: false,
        activeMoELayers: activeMoE,
        elapsedMs: (step + 1) * (turboMode ? 25 : preset.secondsPerToken * 1000),
        trunkReadMb: preset.pinnedLayers >= 90 ? 0 : 1170,
        expertReadMb: 16 * 17.55
      };

      traceAccumulator.push(stepRecord);
      setStepsTrace([...traceAccumulator]);

      await new Promise(resolve => setTimeout(resolve, stepInterval));
    }

    // Build c_run.json
    const finalRunJson = {
      prompt_ids: promptIds,
      generated_ids: emittedIds,
      full_ids: [...promptIds, ...emittedIds],
      layers: selectedLayers,
      layers_requested: selectedLayers,
      layers_completed: selectedLayers,
      expert_drops: 0,
      peak_rss_bytes: Math.round(plan.peakRssGb * 1024 * 1024 * 1024),
      wall_seconds: Number((stepsToRun * preset.secondsPerToken).toFixed(4)),
      seconds_per_token: preset.secondsPerToken,
      expert_bytes_read: stepsToRun * 16 * MODEL_CENSUS.bytesPerExpert,
      trunk_bytes_read: stepsToRun * (MODEL_CENSUS.totalLayers - plan.pinnedLayers) * MODEL_CENSUS.denseTrunkPerLayerBytes,
      ultra_low_memory: preset.ultraLowMemory,
      generated_text: textAccumulator
    };

    setRunJsonOutput(JSON.stringify(finalRunJson, null, 2));
    setIsRunning(false);
  };

  const copyJson = () => {
    if (!runJsonOutput) return;
    navigator.clipboard.writeText(runJsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* CLI Synopsis Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-mono">
                k3 &lt;model_dir&gt; [prompt] [memory] [generation]
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic batch inference engine. Runs full 93-layer forward pass with Top-16 expert routing and MXFP4 dequantization.
            </p>
          </div>

          {/* Example Quick-Pick Buttons */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Examples:</span>
            <button
              onClick={() => loadExample('paris')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              "The capital of France is"
            </button>
            <button
              onClick={() => loadExample('fibonacci')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              "def fibonacci(n):"
            </button>
            <button
              onClick={() => loadExample('ids_oracle')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              --ids [1008, 10484...]
            </button>
          </div>
        </div>

        {/* Input Configuration Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
          {/* Prompt Mode & Input */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputMode('prompt')}
                  className={`px-2.5 py-1 rounded font-mono transition-colors ${
                    inputMode === 'prompt' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  --prompt (Text)
                </button>
                <button
                  onClick={() => setInputMode('ids')}
                  className={`px-2.5 py-1 rounded font-mono transition-colors ${
                    inputMode === 'ids' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  --ids (Token IDs)
                </button>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {inputMode === 'prompt' ? 'Requires --tok directory' : 'Bypasses tokenizer (Exact channel)'}
              </span>
            </div>

            {inputMode === 'prompt' ? (
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter prompt text (e.g. The capital of France is)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <input
                type="text"
                value={tokenIdsInput}
                onChange={(e) => setTokenIdsInput(e.target.value)}
                placeholder="Comma separated token IDs (e.g. 1008, 10484, 318, 15383, 387)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            )}
          </div>

          {/* Execution Knobs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">--gen (Tokens)</label>
                <input
                  type="number"
                  min="1"
                  max="128"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 8)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">--layers (Bind)</label>
                <input
                  type="number"
                  min="1"
                  max="93"
                  value={selectedLayers}
                  onChange={(e) => setSelectedLayers(parseInt(e.target.value) || 93)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-slate-300">
                <input
                  type="checkbox"
                  checked={incremental}
                  onChange={(e) => setIncremental(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0"
                />
                <span>--incremental</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Carries KV & KDA state</span>
            </div>
          </div>
        </div>

        {/* Action Button & Command Equivalent */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 truncate">
            <span className="text-cyan-400">$ ./bin/k3</span> ~/k3model --trunk ~/k3trunk --preset {activePreset} {inputMode === 'prompt' ? `--tok ~/k3model --prompt "${promptText}"` : `--ids ${tokenIdsInput}`} --gen {genCount} {incremental ? '--incremental' : ''} --layers {selectedLayers}
          </div>

          <button
            onClick={runBatchInference}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs font-mono transition-colors disabled:opacity-50 shadow-md shadow-cyan-600/20"
          >
            {isRunning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Running Step {currentStep}/{genCount}...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Batch Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Output & Inspection Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Output Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Generated Output & Token Buffer
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {generatedIds.length} tokens emitted
            </span>
          </div>

          <div className="mt-3 flex-1 min-h-[160px] bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-100 border border-slate-800 overflow-y-auto whitespace-pre-wrap">
            {generatedOutput || (
              <span className="text-slate-600 italic">
                {isRunning ? 'Streaming tokens off disk...' : 'Run batch inference to observe byte-identical tokens.'}
              </span>
            )}
          </div>

          {/* Emitted Token IDs Array */}
          {generatedIds.length > 0 && (
            <div className="mt-3 p-2.5 rounded bg-slate-950/70 border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-400">Emitted IDs: </span>
              <span className="text-cyan-300">[{generatedIds.join(', ')}]</span>
            </div>
          )}
        </div>

        {/* c_run.json Structured Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              k3_run.json Output (Harness Contract)
            </h3>
            {runJsonOutput && (
              <button
                onClick={copyJson}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <div className="mt-3 flex-1 min-h-[160px] bg-slate-950 rounded-lg p-4 font-mono text-[11px] text-emerald-300/90 border border-slate-800 overflow-y-auto">
            {runJsonOutput ? (
              <pre>{runJsonOutput}</pre>
            ) : (
              <span className="text-slate-600 italic">
                JSON output will be formatted upon step completion.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step Trace MoE Inspector */}
      {stepsTrace.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Layer MoE Routing Trace (Top-16 Experts / Layer)
          </h3>

          <div className="space-y-2 overflow-x-auto">
            {stepsTrace.map((st) => (
              <div
                key={st.step}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px]">
                    Step {st.step}
                  </span>
                  <span className="text-slate-300 font-bold">"{st.tokenText}"</span>
                  <span className="text-slate-500 text-[11px]">id: {st.tokenId}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>Trunk Read: <b className="text-slate-200">{st.trunkReadMb} MB</b></span>
                  <span>Experts Read: <b className="text-slate-200">{st.expertReadMb.toFixed(1)} MB</b></span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Sample L48 Experts:</span>
                    <span className="text-violet-300">
                      [{st.activeMoELayers.find(l => l.layer === 48)?.activatedExperts.slice(0, 4).join(', ')}...]
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
