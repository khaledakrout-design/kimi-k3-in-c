import React, { useState } from 'react';
import { Header } from './components/Header';
import { ChatTab } from './components/ChatTab';
import { BatchTab } from './components/BatchTab';
import { MemoryDoctorTab } from './components/MemoryDoctorTab';
import { CacheSimTab } from './components/CacheSimTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { MemoryPresetId } from './types/k3';
import { Terminal, Shield, BookOpen, ExternalLink, Cpu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [activePreset, setActivePreset] = useState<MemoryPresetId>('laptop');
  const [turboMode, setTurboMode] = useState<boolean>(true); // Turbo on by default for snappy browser experience

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
        turboMode={turboMode}
        setTurboMode={setTurboMode}
      />

      <main className="flex-1 pb-10">
        {activeTab === 'chat' && (
          <ChatTab activePreset={activePreset} turboMode={turboMode} />
        )}
        {activeTab === 'batch' && (
          <BatchTab activePreset={activePreset} turboMode={turboMode} />
        )}
        {activeTab === 'doctor' && (
          <MemoryDoctorTab
            activePreset={activePreset}
            setActivePreset={setActivePreset}
          />
        )}
        {activeTab === 'cache' && <CacheSimTab />}
        {activeTab === 'reductions' && <ArchitectureTab />}
      </main>

      <footer className="border-t border-slate-800 bg-[#070a12] text-xs font-mono text-slate-500 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">kimi-k3-in-c</span>
            <span>•</span>
            <span>Portable C99 LLM Engine</span>
            <span>•</span>
            <span className="text-emerald-500">Apache 2.0</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>2.78T parameters</span>
            <span>•</span>
            <span>93 layers (92 MoE, 1 dense)</span>
            <span>•</span>
            <span>896 experts (16 active)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
