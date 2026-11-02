import React, { useState } from 'react';
import { 
  Cpu, HardDrive, ShieldCheck, AlertTriangle, ArrowUpRight, 
  CheckCircle, Sliders, Zap, BarChart3, Database, Info, Layers 
} from 'lucide-react';
import { MEMORY_LADDER_DATA, K3_PRESETS, MODEL_CENSUS } from '../data/k3Presets';
import { calculateMemoryPlan } from '../utils/k3Engine';
import { MemoryPresetId } from '../types/k3';

interface MemoryDoctorTabProps {
  activePreset: MemoryPresetId;
  setActivePreset: (p: MemoryPresetId) => void;
}

export const MemoryDoctorTab: React.FC<MemoryDoctorTabProps> = ({
  activePreset,
  setActivePreset
}) => {
  // Doctor custom machine parameters
  const [hostRamGb, setHostRamGb] = useState<number>(32);
  const [diskSpeedMb, setDiskSpeedMb] = useState<number>(4500);
  const [hasAvx2, setHasAvx2] = useState<boolean>(true);
  const [customTrunkGb, setCustomTrunkGb] = useState<number>(K3_PRESETS[activePreset].trunkGb);
  const [customCacheGb, setCustomCacheGb] = useState<number>(K3_PRESETS[activePreset].cacheGb);
  const [ringSlots, setRingSlots] = useState<number>(2);

  // Doctor recommendation
  const getDoctorRecommendation = () => {
    if (hostRamGb >= 192) return { preset: 'server' as MemoryPresetId, note: 'Recommended: server (~10.7 s/tok, 90 layers pinned)' };
    if (hostRamGb >= 96) return { preset: 'workstation' as MemoryPresetId, note: 'Recommended: workstation (~24.4 s/tok, 48 layers pinned)' };
    if (hostRamGb >= 32) return { preset: 'desktop' as MemoryPresetId, note: 'Recommended: desktop (~31.4 s/tok, 11 layers pinned)' };
    if (hostRamGb >= 10) return { preset: 'laptop' as MemoryPresetId, note: 'Recommended: laptop (~32.7 s/tok, fully streamed trunk)' };
    return { preset: 'ultra' as MemoryPresetId, note: 'Recommended: ultra (proof-of-life on 8 GB-class devices)' };
  };

  const doctorRec = getDoctorRecommendation();
  const customPlan = calculateMemoryPlan(customTrunkGb, customCacheGb);
  const isPlanSafe = customPlan.peakRssGb <= hostRamGb * 0.95;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Banner: k3-doctor Diagnostic Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white font-mono">
                scripts/k3-doctor.sh (Host Sizing & Preflight)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Sizes available RAM to an optimal preset, verifies SIMD instruction availability (AVX2+FMA or NEON), measures O_DIRECT disk bandwidth, and prevents out-of-memory terminates before downloading 1.56 TB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Doctor Verdict: </span>
              <span className="text-emerald-400 font-bold uppercase">{doctorRec.preset}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{doctorRec.note}</p>
            </div>
            <button
              onClick={() => {
                setActivePreset(doctorRec.preset);
                setCustomTrunkGb(K3_PRESETS[doctorRec.preset].trunkGb);
                setCustomCacheGb(K3_PRESETS[doctorRec.preset].cacheGb);
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition-colors whitespace-nowrap"
            >
              Apply Recommended
            </button>
          </div>
        </div>

        {/* Machine Spec Adjuster */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1.5">
              <span>Host Available RAM:</span>
              <span className="text-cyan-400 font-bold">{hostRamGb} GB</span>
            </div>
            <input
              type="range"
              min="8"
              max="256"
              step="4"
              value={hostRamGb}
              onChange={(e) => setHostRamGb(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>8 GB (Floor)</span>
              <span>64 GB</span>
              <span>128 GB</span>
              <span>256 GB</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1.5">
              <span>NVMe Bandwidth (O_DIRECT):</span>
              <span className="text-indigo-400 font-bold">{diskSpeedMb} MB/s</span>
            </div>
            <input
              type="range"
              min="500"
              max="7500"
              step="250"
              value={diskSpeedMb}
              onChange={(e) => setDiskSpeedMb(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>SATA (500)</span>
              <span>PCIe Gen3 (3200)</span>
              <span>PCIe Gen4 (6000+)</span>
            </div>
          </div>

          <div>
            <span className="block text-slate-300 font-mono mb-1.5">CPU Instruction Support:</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                AVX2 + FMA
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                ARM NEON
              </span>
              <span className="px-2 py-1 rounded bg-slate-950/40 border border-slate-800 text-slate-500 font-mono text-[10px]">
                AVX-512 (Not needed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Split Tuner & Safety Checker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Custom Memory Split Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune dense trunk RAM vs routed expert cache. "Allocation beats capacity": trunk memory brings bigger gains than cache.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPlanSafe ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-mono">
                <ShieldCheck className="w-4 h-4" />
                Safe Plan (&lt; 95% RAM)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
                <AlertTriangle className="w-4 h-4" />
                Refused (Exceeds 95% RAM)
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trunk GB Slider */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Dense Trunk Budget:</span>
              <span className="text-cyan-400 font-bold">{customTrunkGb} GB</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="114"
              step="0.5"
              value={customTrunkGb}
              onChange={(e) => setCustomTrunkGb(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Pinned Layers: <b className="text-slate-200">{customPlan.pinnedLayers} / 93</b></span>
              <span>Pinned GB: <b className="text-slate-200">{customPlan.pinnedTrunkGb} GB</b></span>
            </div>
          </div>

          {/* Cache GB Slider */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Expert LRU Cache:</span>
              <span className="text-indigo-400 font-bold">{customCacheGb} GB</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="110"
              step="0.5"
              value={customCacheGb}
              onChange={(e) => setCustomCacheGb(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Expert Slots: <b className="text-slate-200">{customPlan.cacheSlots}</b></span>
              <span>Slot Size: <b className="text-slate-200">17.55 MB</b></span>
            </div>
          </div>

          {/* Projected Outcomes */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Projected Peak RSS:</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {customPlan.peakRssGb} GB
              </div>
              <span className="text-[11px] text-slate-500">
                {((customPlan.peakRssGb / hostRamGb) * 100).toFixed(1)}% of {hostRamGb} GB host
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Speed:</span>
                <div className="text-slate-200 font-bold">{customPlan.secPerToken} s/tok</div>
              </div>
              <div>
                <span className="text-slate-500">True Hit Rate:</span>
                <div className="text-cyan-400 font-bold">{customPlan.residentHitRatePercent}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Measured Memory Ladder: 8 GB to 224 GB */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              The Measured Memory Ladder (8 GB to 224 GB)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical data from <code className="text-slate-300">docs/data/memory-ladder.tsv</code> on AMD EPYC 7763 (124 cores, NVMe).
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
            Byte-Identical Output Across All Rows
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-2.5 px-3">Total RAM</th>
                <th className="py-2.5 px-3">Pinned Layers</th>
                <th className="py-2.5 px-3">Cache Slots</th>
                <th className="py-2.5 px-3">Time/Token</th>
                <th className="py-2.5 px-3">True Hit %</th>
                <th className="py-2.5 px-3">Trunk Hit %</th>
                <th className="py-2.5 px-3">Disk Read/Tok</th>
                <th className="py-2.5 px-3">Peak RSS</th>
                <th className="py-2.5 px-3">I/O Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MEMORY_LADDER_DATA.map((row) => {
                const isCurrent = row.totalGb === hostRamGb;
                return (
                  <tr
                    key={row.totalGb}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrent ? 'bg-cyan-950/30 text-cyan-200 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="font-bold">{row.totalGb} GB</span>
                      {isCurrent && <span className="text-[10px] text-cyan-400">(Your spec)</span>}
                    </td>
                    <td className="py-2 px-3">{row.pinLayers}/93 ({row.pinGb} GB)</td>
                    <td className="py-2 px-3">{row.cacheSlots} ({row.cacheGb} GB)</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{row.sPerTok} s</td>
                    <td className="py-2 px-3 text-cyan-400">{row.expertHitTrue}%</td>
                    <td className="py-2 px-3">{row.trunkHit}%</td>
                    <td className="py-2 px-3">{row.gbRead} GB</td>
                    <td className="py-2 px-3 text-amber-300">{row.peakRssGb} GB</td>
                    <td className="py-2 px-3">{row.ioShare}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Technical Lessons from Measurements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
            <Info className="w-4 h-4" />
            Allocation Beats Capacity
          </div>
          <p className="text-slate-400 leading-relaxed">
            At a fixed 128 GB memory budget, giving memory to the dense trunk rather than the expert cache was worth <b>1.69x in throughput</b>. Pinned trunk layers eliminate disk wait completely for always-on weights.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold">
            <HardDrive className="w-4 h-4" />
            Storage Is The Whole Game
          </div>
          <p className="text-slate-400 leading-relaxed">
            Between 41% and 61% of wall-clock time is spent waiting on storage. Reading with <code className="text-slate-200">O_DIRECT</code> was measured <b>faster</b> than buffered reads because it avoids polluting the OS page cache.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
            <ShieldCheck className="w-4 h-4" />
            Refusing To Guess
          </div>
          <p className="text-slate-400 leading-relaxed">
            The engine declines to guess any missing config field and rejects any memory plan exceeding 95% of available RAM. This guarantees identical numerical precision and zero sudden OOM aborts.
          </p>
        </div>
      </div>
    </div>
  );
};
