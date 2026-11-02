import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Trash2, Download, Upload, HelpCircle, RefreshCw, 
  Settings2, BrainCircuit, ChevronDown, ChevronRight, Copy, Check, Terminal, Cpu, Clock, HardDrive 
} from 'lucide-react';
import { ChatMessage, ChatOptions, MemoryPresetId } from '../types/k3';
import { K3_PRESETS, MODEL_CENSUS } from '../data/k3Presets';
import { Pcg32, simulateMoEStep } from '../utils/k3Engine';

interface ChatTabProps {
  activePreset: MemoryPresetId;
  turboMode: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({ activePreset, turboMode }) => {
  const preset = K3_PRESETS[activePreset];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'system',
      content: 'You are a helpful assistant powered by Kimi K3 running in portable C99.',
      timestamp: Date.now() - 100000
    },
    {
      id: 'init-2',
      role: 'user',
      content: 'Explain cache locality and how it relates to streaming a 1.56 TB model.',
      timestamp: Date.now() - 60000
    },
    {
      id: 'init-3',
      role: 'assistant',
      content: 'Cache locality is the tendency of a computer processor to access the same set of memory locations repeatedly over a short time period. It manifests in two primary forms:\n\n1. **Temporal Locality:** If a memory location is referenced once, it will likely be referenced again soon.\n2. **Spatial Locality:** If a memory location is accessed, nearby memory locations will likely be referenced shortly thereafter.\n\nIn **kimi-k3-in-c**, caching works through four deliberate reductions:\n- The **dense trunk** (93 layers) is packed into a contiguous 109 GB binary on disk and read with single `O_DIRECT` calls, taking maximum advantage of hardware sequential NVMe throughput.\n- The **routed experts** (82,432 experts across 92 MoE layers) exploit temporal reuse: while only 16 of 896 experts activate per layer, common queries cluster around expert subsets. Our LRU cache holds between 28 slots (laptop) and 6,208 slots (server), achieving up to 43.8% true resident hits without memory explosion.',
      reasoning_content: 'Analyzing user question regarding cache locality in the context of the Kimi K3 C-engine architecture.\n1. Need to define temporal and spatial locality.\n2. Explain why traditional LLMs fail on consumer hardware: 2.78T parameters at BF16 requires 5.56 TB RAM.\n3. Detail how kimi-k3-in-c uses O_DIRECT sequential reads for the dense trunk (spatial locality) and an LRU cache for 16-of-896 MoE expert activations (temporal locality).\n4. Highlight that Peak RSS stays at 8.24 GB on ordinary laptops while maintaining byte-exact output parity with 224 GB server nodes.',
      timestamp: Date.now() - 30000,
      metrics: {
        totalTokens: 184,
        thinkingTokens: 88,
        responseTokens: 96,
        elapsedSeconds: 5.6,
        secPerToken: preset.secondsPerToken,
        ioSharePercent: preset.pinnedLayers >= 90 ? 41.2 : 57.3,
        residentHitRate: preset.pinnedLayers >= 90 ? 43.7 : 12.5,
        memoryRssGb: preset.peakRssGb
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({
    'init-3': true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat Options
  const [options, setOptions] = useState<ChatOptions>({
    thinking: true,
    thinkingEffort: 'max',
    temperature: 1.0,
    topP: 0.95,
    seed: 42,
    greedy: true,
    maxTokens: 4096,
    incremental: true,
    preset: activePreset
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const toggleThinking = (id: string) => {
    setExpandedThinking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCommand = (cmd: string): boolean => {
    const trimmed = cmd.trim();
    if (trimmed === '/help') {
      const helpMsg: ChatMessage = {
        id: `help-${Date.now()}`,
        role: 'system',
        content: `kimi-k3-in-c REPL Commands:
• /help     - Display this command reference
• /reset    - Reset conversation while retaining the initial system prompt
• /clear    - Clear all messages completely
• /stats    - Display current memory and hardware ladder specs
• /think    - Toggle thinking channel on/off (${options.thinking ? 'Currently ON' : 'Currently OFF'})`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, helpMsg]);
      return true;
    }
    if (trimmed === '/reset') {
      setMessages(prev => {
        const sys = prev.find(m => m.role === 'system');
        return sys ? [sys] : [];
      });
      return true;
    }
    if (trimmed === '/clear') {
      setMessages([]);
      return true;
    }
    if (trimmed === '/think') {
      setOptions(prev => ({ ...prev, thinking: !prev.thinking }));
      return true;
    }
    if (trimmed === '/stats') {
      const statsMsg: ChatMessage = {
        id: `stats-${Date.now()}`,
        role: 'system',
        content: `Current Engine Statistics (${preset.name} preset):
• Peak RSS: ${preset.peakRssGb} GB
• Pinned Trunk: ${preset.pinnedLayers}/${preset.totalLayers} layers (${preset.trunkGb} GB)
• Expert Cache: ${preset.cacheGb} GB (${Math.floor((preset.cacheGb * 1024) / 17.55)} slots)
• Measured Speed: ${preset.secondsPerToken} s/token
• Storage I/O Share: ${preset.pinnedLayers >= 90 ? '40.9%' : '57.3%'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, statsMsg]);
      return true;
    }
    return false;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput('');

    if (userText.startsWith('/')) {
      if (handleCommand(userText)) return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    const assistantId = `asst-${Date.now()}`;
    const rng = new Pcg32(options.seed);

    // Initial assistant container
    const initialAsst: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning_content: options.thinking ? '' : null,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, initialAsst]);
    if (options.thinking) {
      setExpandedThinking(prev => ({ ...prev, [assistantId]: true }));
    }

    // Generate realistic or dynamic response based on prompt
    let simulatedReasoning = '';
    let simulatedResponse = '';

    if (userText.toLowerCase().includes('fibonacci')) {
      simulatedReasoning = `User requested Fibonacci implementation.\n1. Analyze Kimi K3 token encoding for code blocks.\n2. In C99 engine, incremental decoding caches prefix keys and recurrent states.\n3. Formulate concise recursive vs iterative solution with time complexity O(n).`;
      simulatedResponse = `Here is an efficient Fibonacci implementation in Python:\n\n\`\`\`python\ndef fibonacci(n: int) -> int:\n    """Return the n-th Fibonacci number with O(n) time and O(1) space."""\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\`\`\`\n\nUnder \`--incremental\` mode, the engine prefills the prompt once and carries forward the KDA recurrent state across generated tokens.`;
    } else if (userText.toLowerCase().includes('paris') || userText.toLowerCase().includes('capital of france')) {
      simulatedReasoning = `User asks for the capital of France.\n1. Verify knowledge retrieval from prefill state.\n2. Confirm Paris is the sovereign capital.\n3. Output byte-identical sequence matching reference fixtures.`;
      simulatedResponse = `The capital of France is Paris.`;
    } else if (userText.toLowerCase().includes('reduction') || userText.toLowerCase().includes('four reductions')) {
      simulatedReasoning = `Reviewing the 4 Reductions in the Kimi K3 C-engine architecture:\n1. MXFP4: 4-bit float dequantization directly in CPU registers (1.447 TB expert set).\n2. KDA: Kimi Delta Attention keeps a constant 9-step recurrent state.\n3. MLA: Multi-Head Latent Attention compresses 96 KV heads to a 512-dim latent.\n4. Streamed Trunk: O_DIRECT single-read per layer with ring buffer, keeping peak RSS to 8.24 GB.`;
      simulatedResponse = `The **4 Reductions** that allow a 2.78-trillion parameter model to run on an ordinary 8 GB laptop are:\n\n1. **MXFP4 Quantization (3.56x reduction):** 4-bit E2M1 weights with shared 8-bit E8M0 scale per 32 elements. Dequantized on-the-fly during dot products.\n2. **KDA Recurrent State (Bounded KV):** Linear delta attention maintains a constant-size state that never expands regardless of token length.\n3. **MLA Latent Projection (7.8x KV compression):** Compresses 96 KV heads into a single 512-dimensional latent vector.\n4. **Streamed Packed Trunk (13.8x RAM reduction):** Dense layers stream from NVMe via \`O_DIRECT\` while an LRU cache manages the 16 active experts per layer.`;
    } else {
      simulatedReasoning = `Processing query: "${userText}"\n1. Evaluating token embeddings across 93 layers.\n2. Activating 16 of 896 routed experts per MoE layer via Top-K router.\n3. Resolving latent representation via Multi-Head Latent Attention (MLA).\n4. Ensuring bit-exact reproduction against reference logits.`;
      simulatedResponse = `Regarding "${userText}":\n\nIn Kimi K3's architecture, this request processes through 93 transformer layers (Layer 0 dense, Layers 1-92 MoE). At each layer, exactly 16 of 896 routed experts are selected and dequantized from MXFP4 4-bit nibbles.\n\nBecause the engine uses portable C99 and fixed scalar accumulation ordering (\`-ffp-contract=off\`), this response produces the exact same bit sequence whether run on an 8 GB laptop or a 224 GB server node.`;
    }

    // Stream reasoning tokens if thinking is enabled
    const tokenDelay = turboMode ? 20 : 60;

    if (options.thinking) {
      const thoughtWords = simulatedReasoning.split(' ');
      let currentThought = '';
      for (let i = 0; i < thoughtWords.length; i++) {
        currentThought += (i === 0 ? '' : ' ') + thoughtWords[i];
        const updateText = currentThought;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, reasoning_content: updateText } : m));
        await new Promise(r => setTimeout(r, tokenDelay));
      }
    }

    // Stream response tokens
    const responseWords = simulatedResponse.split(' ');
    let currentResponse = '';
    for (let i = 0; i < responseWords.length; i++) {
      currentResponse += (i === 0 ? '' : ' ') + responseWords[i];
      const updateText = currentResponse;
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: updateText } : m));
      await new Promise(r => setTimeout(r, tokenDelay));
    }

    // Complete metrics
    const totalTokens = (options.thinking ? simulatedReasoning.split(' ').length : 0) + simulatedResponse.split(' ').length;
    const finalMetrics = {
      totalTokens,
      thinkingTokens: options.thinking ? simulatedReasoning.split(' ').length : 0,
      responseTokens: simulatedResponse.split(' ').length,
      elapsedSeconds: Number(((totalTokens * (turboMode ? 0.05 : preset.secondsPerToken / 10)).toFixed(2))),
      secPerToken: preset.secondsPerToken,
      ioSharePercent: preset.pinnedLayers >= 90 ? 41.2 : 57.3,
      residentHitRate: preset.pinnedLayers >= 90 ? 43.7 : 12.5,
      memoryRssGb: preset.peakRssGb
    };

    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, metrics: finalMetrics } : m));
    setIsGenerating(false);
  };

  const exportHistoryJsonl = () => {
    const lines = messages.map(m => {
      const item: any = { role: m.role, content: m.content };
      if (m.role === 'assistant' && m.reasoning_content) {
        item.reasoning_content = m.reasoning_content;
      }
      return JSON.stringify(item);
    }).join('\n');

    const blob = new Blob([lines], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k3-session-${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importHistoryJsonl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const parsed: ChatMessage[] = lines.map((line, idx) => {
          const obj = JSON.parse(line);
          return {
            id: `imported-${idx}-${Date.now()}`,
            role: obj.role,
            content: obj.content,
            reasoning_content: obj.reasoning_content || null,
            timestamp: Date.now() - (lines.length - idx) * 1000
          };
        });
        setMessages(parsed);
      } catch (err) {
        alert('Failed to parse JSONL history file: ' + err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Session Actions & Settings Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">XTML REPL Mode</span>
          <span className="text-slate-600">•</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
            options.thinking 
              ? 'bg-purple-950/60 text-purple-300 border-purple-800' 
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {options.thinking ? `<think> channel ON (${options.thinkingEffort})` : '<think> channel OFF'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">
            {options.greedy ? 'Greedy (argmax)' : `Sampling (T=${options.temperature}, p=${options.topP})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Options</span>
          </button>
          <button
            onClick={exportHistoryJsonl}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Export session transcript to JSONL format"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export JSONL</span>
          </button>
          <label className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Import JSONL</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jsonl,.json"
              className="hidden"
              onChange={importHistoryJsonl}
            />
          </label>
          <button
            onClick={() => handleCommand('/reset')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Reset conversation preserving system prompt"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="p-4 mb-3 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Thinking Channel</label>
            <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setOptions(o => ({ ...o, thinking: true }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  options.thinking ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                onClick={() => setOptions(o => ({ ...o, thinking: false }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  !options.thinking ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {options.thinking ? 'Renders <think> segments' : 'Outputs directly to <response>'}
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Thinking Effort</label>
            <select
              value={options.thinkingEffort}
              onChange={(e) => setOptions(o => ({ ...o, thinkingEffort: e.target.value as any }))}
              disabled={!options.thinking}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 disabled:opacity-40"
            >
              <option value="low">low (brief reasoning)</option>
              <option value="high">high (thorough analysis)</option>
              <option value="max">max (full multi-step proof)</option>
            </select>
            <p className="mt-1 text-[10px] text-slate-500">Official Kimi K3 tokenization switch</p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Decoding Strategy</label>
            <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setOptions(o => ({ ...o, greedy: true }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  options.greedy ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Greedy (Argmax)
              </button>
              <button
                onClick={() => setOptions(o => ({ ...o, greedy: false }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  !options.greedy ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sampling
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {options.greedy ? 'Deterministic bit-exact replay' : `T=${options.temperature}, p=${options.topP}, PCG32`}
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Incremental State Carry</label>
            <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setOptions(o => ({ ...o, incremental: true }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  options.incremental ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                --incremental (O(1))
              </button>
              <button
                onClick={() => setOptions(o => ({ ...o, incremental: false }))}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  !options.incremental ? 'bg-rose-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recompute (O(T²))
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">KV cache & KDA recurrent state reuse</p>
          </div>
        </div>
      )}

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isSystem = m.role === 'system';
          const isAssistant = m.role === 'assistant';

          if (isSystem) {
            return (
              <div key={m.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold uppercase">[SYSTEM]: </span>
                <span>{m.content}</span>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  {isUser ? 'User' : 'Kimi K3 Assistant'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div
                className={`max-w-3xl rounded-xl p-4 shadow-sm relative group ${
                  isUser
                    ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-800/60 text-slate-100'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Thinking Block */}
                {isAssistant && m.reasoning_content !== undefined && m.reasoning_content !== null && (
                  <div className="mb-3 rounded-lg bg-slate-950/80 border border-purple-900/40 overflow-hidden text-xs">
                    <button
                      onClick={() => toggleThinking(m.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-purple-950/30 text-purple-300 font-mono hover:bg-purple-950/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                        <span>&lt;think&gt; Channel ({options.thinkingEffort})</span>
                      </div>
                      {expandedThinking[m.id] ? (
                        <ChevronDown className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      )}
                    </button>

                    {expandedThinking[m.id] && (
                      <div className="p-3 text-slate-400 font-mono text-xs whitespace-pre-wrap border-t border-purple-900/30 leading-relaxed max-h-60 overflow-y-auto">
                        {m.reasoning_content || <span className="italic text-slate-600 animate-pulse">Decompressing reasoning latent states...</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content || (
                    <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-xs animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Streaming layer trunk & routed experts...
                    </span>
                  )}
                </div>

                {/* Turn Metrics Footer */}
                {isAssistant && m.metrics && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{m.metrics.totalTokens} tokens ({m.metrics.thinkingTokens} think + {m.metrics.responseTokens} resp)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-indigo-400" />
                      <span>I/O Share: <b className="text-slate-300">{m.metrics.ioSharePercent}%</b></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      <span>Resident Hit: <b className="text-emerald-400">{m.metrics.residentHitRate}%</b></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>RSS: <b className="text-slate-200">{m.metrics.memoryRssGb} GB</b></span>
                    </div>
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(m.content, m.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                  title="Copy message content"
                >
                  {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Prompt Box & REPL Controls */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-slate-500 font-mono">Quick Prompts:</span>
          {[
            'Explain cache locality.',
            'What are the four reductions in Kimi K3?',
            'The capital of France is',
            'def fibonacci(n):'
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => {
                setInput(prompt);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:border-cyan-700 hover:text-cyan-300 font-mono transition-colors truncate max-w-[200px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or command (/help, /reset, /clear, /stats)..."
            disabled={isGenerating}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="absolute right-2 p-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40 disabled:hover:bg-cyan-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
