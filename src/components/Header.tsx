import React from 'react';
import { Cpu, HardDrive, Database, Zap, Sparkles, Terminal, Activity, Layers, Sliders } from 'lucide-react';
import { K3_PRESETS } from '../data/k3Presets';
import { MemoryPresetId } from '../types/k3';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activePreset: MemoryPresetId;
  setActivePreset: (preset: MemoryPresetId) => void;
  turboMode: boolean;
  setTurboMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activePreset,
  setActivePreset,
  turboMode,
  setTurboMode
}) => {
  const preset = K3_PRESETS[activePreset];

  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur sticky top-0 z-50">
      {/* Top Banner Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  kimi-k3-in-c
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                    v1.1.0 C99
                  </span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  Bit-Exact Parity
                </span>
              </div>
              <p className="text-xs text-slate-400">
                2.78-trillion parameters • Single CPU • 8 GB RAM • No BLAS • Zero GPUs
              </p>
            </div>
          </div>

          {/* Machine Spec Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model: <b className="text-white">2.78T</b></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Disk: <b className="text-white">1.56 TB</b></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Peak RSS: <b className="text-emerald-400">{preset.peakRssGb} GB</b></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span>Engine: <b className="text-white">176 KB</b></span>
            </div>
          </div>
        </div>

        {/* Preset & Execution Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" />
              Preset:
            </span>
            <div className="flex rounded-md bg-slate-900 p-0.5 border border-slate-800 text-xs">
              {(Object.keys(K3_PRESETS) as MemoryPresetId[]).map((pId) => {
                const isSelected = activePreset === pId;
                return (
                  <button
                    key={pId}
                    onClick={() => setActivePreset(pId)}
                    className={`px-2.5 py-1 rounded font-mono transition-all capitalize ${
                      isSelected
                        ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={K3_PRESETS[pId].description}
                  >
                    {pId}
                  </button>
                );
              })}
            </div>
            <span className="hidden md:inline text-[11px] text-slate-500 font-mono">
              ({preset.trunkGb}GB trunk / {preset.cacheGb}GB cache • {preset.targetHardware})
            </span>
          </div>

          {/* Turbo preview vs realistic hardware delay */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTurboMode(!turboMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                turboMode
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle between realistic hardware disk streaming delay and accelerated browser preview"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed: {turboMode ? 'Turbo Mode (Fast)' : `Realistic (${preset.secondsPerToken}s/tok)`}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-3 flex space-x-1 sm:space-x-2 border-b border-slate-800 -mb-3 overflow-x-auto pb-1">
          {[
            { id: 'chat', label: 'XTML Chat REPL', icon: Terminal },
            { id: 'batch', label: 'Batch Inference & Tokens', icon: Activity },
            { id: 'doctor', label: 'Memory Ladder & Doctor', icon: Cpu },
            { id: 'cache', label: 'MoE Cache Simulator', icon: Layers },
            { id: 'reductions', label: 'The 4 Reductions', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/80 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
