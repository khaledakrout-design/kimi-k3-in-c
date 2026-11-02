import { MemoryPreset, MemoryLadderRow } from '../types/k3';

export const K3_PRESETS: Record<string, MemoryPreset> = {
  ultra: {
    id: 'ultra',
    name: 'ultra',
    tagline: 'Proof of Life on 8 GB ARM / Embedded',
    trunkGb: 2.5,
    cacheGb: 0.31,
    pinnedLayers: 0,
    totalLayers: 93,
    peakRssGb: 2.76,
    secondsPerToken: 948.5,
    ringSlots: 1,
    ultraLowMemory: true,
    description: 'Streamed exact embedding rows and lm_head chunks; full recompute reuses one recurrent-state slot. Verified on Jetson Orin Nano Super.',
    targetHardware: '8 GB ARM64 / Embedded SBCs'
  },
  laptop: {
    id: 'laptop',
    name: 'laptop',
    tagline: 'The Ordinary-Path Floor',
    trunkGb: 3.0,
    cacheGb: 1.0,
    pinnedLayers: 0,
    totalLayers: 93,
    peakRssGb: 8.24,
    secondsPerToken: 32.69,
    ringSlots: 2,
    ultraLowMemory: false,
    description: 'The whole model streams off the disk on every step. Peak RSS measured at 8.24 GB with byte-identical output to 224 GB servers.',
    targetHardware: 'Ordinary 8-16 GB Laptops'
  },
  desktop: {
    id: 'desktop',
    name: 'desktop',
    tagline: 'Balanced Home Workstation',
    trunkGb: 16.0,
    cacheGb: 10.0,
    pinnedLayers: 11,
    totalLayers: 93,
    peakRssGb: 31.9,
    secondsPerToken: 31.44,
    ringSlots: 2,
    ultraLowMemory: false,
    description: '11 pinned trunk layers plus 10 GB expert cache (~615 slots). Reduces disk I/O significantly while maintaining reasonable RAM footprint.',
    targetHardware: '32-48 GB Desktop PCs'
  },
  workstation: {
    id: 'workstation',
    name: 'workstation',
    tagline: 'Heavy Multicore Studio',
    trunkGb: 60.0,
    cacheGb: 30.0,
    pinnedLayers: 48,
    totalLayers: 93,
    peakRssGb: 95.51,
    secondsPerToken: 24.4,
    ringSlots: 2,
    ultraLowMemory: false,
    description: 'Pins 48 of 93 trunk layers. The 30 GB expert cache starts delivering ~30% true resident hit rate, cutting wall-clock wait.',
    targetHardware: '64-128 GB High-End Workstations'
  },
  server: {
    id: 'server',
    name: 'server',
    tagline: 'Fastest Per Gigabyte (Recommended)',
    trunkGb: 110.0,
    cacheGb: 13.0,
    pinnedLayers: 90,
    totalLayers: 93,
    peakRssGb: 128.18,
    secondsPerToken: 10.69,
    ringSlots: 2,
    ultraLowMemory: false,
    description: 'Pins 90 of 93 trunk layers. Prioritizing trunk over cache yields 1.69x speedup at a fixed 128 GB budget.',
    targetHardware: '128-192 GB Server Nodes'
  },
  max: {
    id: 'max',
    name: 'max',
    tagline: 'Full Resident Trunk & 109 GB Cache',
    trunkGb: 110.0,
    cacheGb: 109.0,
    pinnedLayers: 90,
    totalLayers: 93,
    peakRssGb: 223.82,
    secondsPerToken: 19.21,
    ringSlots: 2,
    ultraLowMemory: false,
    description: 'Trunk pinned and 6,208 expert slots in RAM. Demonstrates memory ceiling where disk I/O share drops below 41%.',
    targetHardware: '256 GB+ Enterprise Servers'
  }
};

export const MEMORY_LADDER_DATA: MemoryLadderRow[] = [
  { totalGb: 8, pinLayers: 0, pinGb: 0.0, cacheGb: 0.49, cacheSlots: 28, sPerTok: 32.69, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 0.0, gbRead: 25.83, peakRssGb: 8.24, ioShare: 57.3, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 12, pinLayers: 0, pinGb: 0.0, cacheGb: 2.79, cacheSlots: 159, sPerTok: 31.41, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 0.0, gbRead: 25.83, peakRssGb: 10.53, ioShare: 59.6, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 16, pinLayers: 3, pinGb: 4.95, cacheGb: 4.39, cacheSlots: 250, sPerTok: 32.21, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 2.8, gbRead: 25.83, peakRssGb: 16.0, ioShare: 55.8, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 24, pinLayers: 7, pinGb: 9.71, cacheGb: 7.58, cacheSlots: 432, sPerTok: 31.85, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 6.6, gbRead: 25.83, peakRssGb: 23.95, ioShare: 55.2, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 32, pinLayers: 11, pinGb: 14.46, cacheGb: 10.8, cacheSlots: 615, sPerTok: 31.44, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 10.3, gbRead: 25.83, peakRssGb: 31.9, ioShare: 53.6, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 48, pinLayers: 19, pinGb: 23.96, cacheGb: 17.19, cacheSlots: 979, sPerTok: 29.76, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 17.9, gbRead: 25.83, peakRssGb: 47.8, ioShare: 51.9, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 64, pinLayers: 27, pinGb: 33.46, cacheGb: 23.59, cacheSlots: 1344, sPerTok: 28.6, expertHitTrue: 0.0, expertHitNaive: 100.0, trunkHit: 25.4, gbRead: 25.83, peakRssGb: 63.71, ioShare: 53.6, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 96, pinLayers: 43, pinGb: 52.47, cacheGb: 36.39, cacheSlots: 2073, sPerTok: 24.4, expertHitTrue: 29.89, expertHitNaive: 100.0, trunkHit: 40.5, gbRead: 18.11, peakRssGb: 95.51, ioShare: 47.2, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 128, pinLayers: 60, pinGb: 72.34, cacheGb: 49.19, cacheSlots: 2802, sPerTok: 29.4, expertHitTrue: 32.2, expertHitNaive: 100.0, trunkHit: 56.5, gbRead: 17.51, peakRssGb: 128.18, ioShare: 60.6, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 160, pinLayers: 76, pinGb: 91.34, cacheGb: 61.99, cacheSlots: 3531, sPerTok: 26.31, expertHitTrue: 33.08, expertHitNaive: 100.0, trunkHit: 71.5, gbRead: 17.28, peakRssGb: 159.98, ioShare: 47.4, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 192, pinLayers: 90, pinGb: 108.19, cacheGb: 77.0, cacheSlots: 4386, sPerTok: 21.32, expertHitTrue: 35.53, expertHitNaive: 100.0, trunkHit: 84.7, gbRead: 16.65, peakRssGb: 191.83, ioShare: 49.9, ids: "17374,20829,10,427,414,1008,606,142957" },
  { totalGb: 224, pinLayers: 90, pinGb: 108.19, cacheGb: 108.98, cacheSlots: 6208, sPerTok: 19.21, expertHitTrue: 43.75, expertHitNaive: 99.93, trunkHit: 84.7, gbRead: 14.53, peakRssGb: 223.82, ioShare: 40.9, ids: "17374,20829,10,427,414,1008,606,142957" }
];

export const MODEL_CENSUS = {
  totalParameters: '2.78 Trillion',
  totalParametersNum: 2780000000000,
  checkpointDiskBytes: 1560936091448, // 1.56 TB
  shardsCount: 96,
  totalLayers: 93,
  moeLayers: 92, // Layer 0 is dense, layers 1-92 are MoE
  expertsPerLayer: 896,
  activatedExpertsPerToken: 16,
  sharedExpertsPerLayer: 2,
  totalRoutedExperts: 82432,
  bytesPerExpert: 17547264, // 17.55 MB
  paramsPerExpert: 33030144,
  bytesPerNibbleWeight: 0.53125, // 0.5 bytes/nibble + 1/32 byte shared E8M0 scale
  totalRoutedExpertDiskBytes: 1446459346944, // 1.447 TB (93% of checkpoint)
  alwaysResidentTrunkParams: 56743648000, // 56.74 B params
  alwaysResidentTrunkBytesBf16: 121859665920, // 113.49 GB
  denseTrunkPerLayerBytes: 1170021000, // ~1.17 GB / layer
  embeddingAndHeadBytes: 5046580000 // ~4.7 GB
};

export const FOUR_REDUCTIONS = [
  {
    step: 1,
    title: 'MXFP4 Expert Quantization',
    startingSize: '5,560 GB (FP16/BF16)',
    reducedSize: '1,560 GB (Shipped Checkpoint)',
    ratio: '3.56x',
    concept: 'Microscaling FP4 nibbles with 32-element E8M0 exponent blocks',
    mechanism: 'Each weight is stored as a 4-bit float (1 sign, 2 exponent, 1 mantissa bit). Every 32 weights share an 8-bit unsigned power-of-two scale factor (E8M0, value = 2^(S-127)). The matrix multiplication decodes nibbles on the fly directly in CPU registers without ever expanding full weight matrices in RAM.'
  },
  {
    step: 2,
    title: 'KDA (Kimi Delta Attention)',
    startingSize: 'O(T) KV footprint scaling',
    reducedSize: 'Constant 9-step recurrent state',
    ratio: 'Bounded memory',
    concept: 'Linear attention state that never grows with sequence length',
    mechanism: 'Instead of storing ever-expanding key-value caches for all attention heads, KDA maintains a fixed-size recurrent delta state (S_t = alpha * S_{t-1} + beta * (k_t outer v_t)). Memory footprint is strictly constant whether sequence length is 10 tokens or 32,768 tokens.'
  },
  {
    step: 3,
    title: 'MLA (Multi-Head Latent Attention)',
    startingSize: '96 KV heads (Uncompressed)',
    reducedSize: '1 Latent Vector (512-dim)',
    ratio: '7.8x KV compression',
    concept: 'Low-rank key-value projection and decoupled RoPE',
    mechanism: 'Compresses KV heads into a single shared latent vector c_t of dimension d_c = 512, plus a decoupled rope vector k_pe of 64 dims. During inference, only the compressed latent vector is cached, saving over 87% of KV memory.'
  },
  {
    step: 4,
    title: 'Streamed Packed Trunk & LRU Expert Cache',
    startingSize: '113.49 GB resident trunk',
    reducedSize: '8.24 GB Peak RSS (Floor)',
    ratio: '13.8x RAM reduction',
    concept: 'Single-read O_DIRECT per layer with asynchronous ring buffer',
    mechanism: 'The 93 dense trunk layers are packed into a single 109 GB contiguous file. During inference, only the currently active layer (and 1-2 prefetch ring slots) are loaded into RAM via non-buffered O_DIRECT. The 16 activated experts out of 896 are prefetched on demand into an LRU cache.'
  }
];

export const GATE_VERIFICATION_TESTS = [
  {
    name: 'GATE 1: Teacher Forcing Verification',
    positionsMatched: '32/32 positions match tf_pred',
    generatedSpan: '20/20 exact match',
    status: 'PASS',
    description: 'Proves numerical bit-identity against PyTorch reference across 13-layer oracle tensor graph without approximation.'
  },
  {
    name: 'GATE 2: Greedy Decoding Parity',
    positionsMatched: '20/20 generated tokens match full_ids',
    generatedSpan: 'Exact bit-for-bit',
    status: 'PASS',
    description: 'Verifies top-1 argmax decode loop reproduces exact reference output sequence under greedy generation.'
  },
  {
    name: 'GATE 3: Incremental State Carry-Over',
    positionsMatched: '20/20 generated tokens match full_ids',
    generatedSpan: 'KV Cache + carried KDA recurrent state',
    status: 'PASS',
    description: 'Proves carrying state between decode steps yields identical output to full sequence recomputation at a fraction of compute cost.'
  }
];
