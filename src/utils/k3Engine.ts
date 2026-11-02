import { K3_PRESETS, MODEL_CENSUS } from '../data/k3Presets';
import { MemoryPresetId, MoELayerTrace, GenerationStepResult } from '../types/k3';

// PCG32 random number generator (matching src/chat/k3_sampler.c)
export class Pcg32 {
  private state: bigint;
  private inc: bigint;

  constructor(seed: number = 42) {
    this.state = BigInt(seed);
    this.inc = 1442695040888963407n | 1n;
  }

  nextUint32(): number {
    const oldstate = this.state;
    this.state = (oldstate * 6364136223846793005n + this.inc) & 0xffffffffffffffffn;
    const xorshifted = Number(((oldstate >> 18n) ^ oldstate) >> 27n) >>> 0;
    const rot = Number(oldstate >> 59n);
    return ((xorshifted >>> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  nextFloat(): number {
    return this.nextUint32() / 4294967296.0;
  }
}

/**
 * Calculates authentic memory plan based on trunk and cache configuration.
 */
export function calculateMemoryPlan(
  trunkGb: number,
  cacheGb: number,
  ultraLow: boolean = false
) {
  const bytesPerLayer = MODEL_CENSUS.denseTrunkPerLayerBytes;
  const totalLayers = MODEL_CENSUS.totalLayers;
  
  // Layer 0 is dense, 1-92 are MoE
  // How many trunk layers can be pinned in trunkGb?
  const pinnedLayerCount = Math.min(
    totalLayers,
    Math.max(0, Math.floor((trunkGb * 1024 * 1024 * 1024 - 4.7 * 1024 * 1024 * 1024) / bytesPerLayer))
  );

  const pinnedTrunkGb = (pinnedLayerCount * bytesPerLayer) / (1024 * 1024 * 1024);
  const cacheSlots = Math.floor((cacheGb * 1024 * 1024 * 1024) / MODEL_CENSUS.bytesPerExpert);

  // Peak RSS estimation based on empirically measured ladder formula
  let peakRssGb = 0;
  if (ultraLow) {
    peakRssGb = 2.76;
  } else {
    // base working set (~4.2 GB overhead: KV state, KDA recurrence, embeddings, ring buffer)
    const baseOverhead = 4.2;
    peakRssGb = Math.min(224, Math.max(8.24, pinnedTrunkGb + cacheGb * 0.95 + baseOverhead));
  }

  // Estimated true resident hit rate
  // As cache slots rise from 28 (0.5GB) to 6208 (109GB), hit rate rises from 0% to ~44%
  const hitRateFactor = Math.min(0.44, (cacheSlots / 7000) * 0.44);
  const residentHitRatePercent = (hitRateFactor * 100);

  // Seconds per token estimate
  let secPerToken = 32.69;
  if (ultraLow) {
    secPerToken = 948.5;
  } else if (pinnedLayerCount >= 90) {
    secPerToken = 10.69;
  } else if (pinnedLayerCount >= 48) {
    secPerToken = 24.4;
  } else if (pinnedLayerCount >= 11) {
    secPerToken = 31.44;
  } else {
    secPerToken = 32.69;
  }

  return {
    pinnedLayers: pinnedLayerCount,
    totalLayers,
    pinnedTrunkGb: Number(pinnedTrunkGb.toFixed(2)),
    cacheSlots,
    peakRssGb: Number(peakRssGb.toFixed(2)),
    residentHitRatePercent: Number(residentHitRatePercent.toFixed(1)),
    secPerToken,
    ioSharePercent: pinnedLayerCount >= 90 ? 41.2 : 57.3
  };
}

/**
 * Simulates one step of inference across 92 MoE layers with Top-16 expert selection.
 */
export function simulateMoEStep(
  step: number,
  presetId: MemoryPresetId,
  rng: Pcg32
): MoELayerTrace[] {
  const preset = K3_PRESETS[presetId] || K3_PRESETS.laptop;
  const traces: MoELayerTrace[] = [];

  // Simulate a subset of layers (e.g. 5 sampled layers for UI display)
  const sampleLayers = [1, 24, 48, 72, 92];

  for (const l of sampleLayers) {
    const activated: number[] = [];
    let hits = 0;
    let misses = 0;

    for (let k = 0; k < 16; k++) {
      // Clustered expert activation to mirror real MoE locality
      const clusterBase = ((l * 9 + step * 3) % 55) * 16;
      const expertId = (clusterBase + (rng.nextUint32() % 16)) % MODEL_CENSUS.expertsPerLayer;
      activated.push(expertId);

      // Hit probability scales with preset
      const hitProb = preset.pinnedLayers > 60 ? 0.42 : (preset.pinnedLayers > 10 ? 0.15 : 0.02);
      if (rng.nextFloat() < hitProb) {
        hits++;
      } else {
        misses++;
      }
    }

    traces.push({
      layer: l,
      activatedExperts: activated,
      cacheHits: hits,
      cacheMisses: misses,
      ioTimeMs: misses * 1.8,
      computeTimeMs: 4.2
    });
  }

  return traces;
}
