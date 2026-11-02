export type MemoryPresetId = 'ultra' | 'laptop' | 'desktop' | 'workstation' | 'server' | 'max';

export interface MemoryPreset {
  id: MemoryPresetId;
  name: string;
  tagline: string;
  trunkGb: number;
  cacheGb: number;
  pinnedLayers: number;
  totalLayers: number;
  peakRssGb: number;
  secondsPerToken: number;
  ringSlots: number;
  ultraLowMemory: boolean;
  description: string;
  targetHardware: string;
}

export type ThinkingEffort = 'low' | 'high' | 'max';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning_content?: string | null;
  timestamp: number;
  metrics?: {
    totalTokens: number;
    thinkingTokens: number;
    responseTokens: number;
    elapsedSeconds: number;
    secPerToken: number;
    ioSharePercent: number;
    residentHitRate: number;
    memoryRssGb: number;
  };
}

export interface ChatOptions {
  thinking: boolean;
  thinkingEffort: ThinkingEffort;
  temperature: number;
  topP: number;
  seed: number;
  greedy: boolean;
  maxTokens: number;
  incremental: boolean;
  preset: MemoryPresetId;
}

export interface MemoryLadderRow {
  totalGb: number;
  pinLayers: number;
  pinGb: number;
  cacheGb: number;
  cacheSlots: number;
  sPerTok: number;
  expertHitTrue: number;
  expertHitNaive: number;
  trunkHit: number;
  gbRead: number;
  peakRssGb: number;
  ioShare: number;
  ids: string;
}

export interface MoELayerTrace {
  layer: number;
  activatedExperts: number[];
  cacheHits: number;
  cacheMisses: number;
  ioTimeMs: number;
  computeTimeMs: number;
}

export interface GenerationStepResult {
  step: number;
  tokenId: number;
  tokenText: string;
  isThinking: boolean;
  activeMoELayers: MoELayerTrace[];
  elapsedMs: number;
  trunkReadMb: number;
  expertReadMb: number;
}
