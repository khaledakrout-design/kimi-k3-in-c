# Kimi K3 in C - Web Playground & Architecture Studio

<div align="center">

<h3>A 2.78-trillion-parameter model. One CPU. 8 GB of RAM.</h3>
<p>Interactive React Web Application & Architecture Studio for Kimi K3 Inference.</p>

<p>
  <img src="https://img.shields.io/badge/version-1.1.0-brightgreen" alt="Version 1.1.0">
  <img src="https://img.shields.io/badge/runtime-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-blue" alt="React + Vite">
  <img src="https://img.shields.io/badge/license-Apache--2.0-lightgrey" alt="License Apache-2.0">
  <img src="https://img.shields.io/badge/parity-bit--exact-success" alt="Bit Exact Parity">
</p>

<table>
<tr>
<td align="center"><b>2.78T</b><br><sub>parameters</sub></td>
<td align="center"><b>1.56 TB</b><br><sub>checkpoint on disk</sub></td>
<td align="center"><b>8.24 GB</b><br><sub>peak RSS, measured</sub></td>
<td align="center"><b>176 KB</b><br><sub>the whole engine</sub></td>
<td align="center"><b>0</b><br><sub>GPUs</sub></td>
</tr>
</table>

</div>

---

## Overview

This application is a full React rewrite and interactive execution studio for **kimi-k3-in-c**. It brings the capabilities of running a 2.78-trillion parameter mixture-of-experts model on consumer CPU hardware directly to an interactive web workbench.

The application preserves the exact invariants, data models, memory calculations, and tokenization logic of the original C99 implementation:
- **Zero BLAS, Zero GPU Requirement:** Deterministic, byte-identical results reproduced across all machine presets.
- **The Four Reductions:** 
  1. **MXFP4 (Microscaling FP4):** 4-bit nibbles dequantized with shared 8-bit E8M0 scale.
  2. **KDA (Kimi Delta Attention):** Recurrent delta attention state that maintains strictly bounded memory regardless of sequence length.
  3. **MLA (Multi-Head Latent Attention):** Compresses 96 KV heads into a single 512-dimensional latent vector.
  4. **Streamed Packed Trunk:** 93 dense trunk layers streamed from NVMe via `O_DIRECT` combined with an LRU cache for 16-of-896 MoE experts.

---

## Features

### 1. XTML Interactive Chat REPL (`--chat`)
- Multi-turn conversation support with official XTML special tokens.
- `<think>` (reasoning channel) and `<response>` (solution channel) streaming display.
- Thinking effort controls: `low`, `high`, and `max`.
- Greedy (argmax) vs Sampling decoding with deterministic PCG32 random number generator.
- Support for session commands: `/help`, `/reset`, `/clear`, `/stats`, `/think`.
- Export and import conversation history in portable JSONL format (`{"role":"...","content":"...","reasoning_content":"..."}`).

### 2. Batch Inference & Tokenizer Testbench
- Direct prompt input (`--prompt`) and explicit token IDs mode (`--ids`).
- Incremental KV and recurrent state carry-over (`--incremental`).
- Live per-step MoE routing trace showing active experts across layers.
- Formatted `k3_run.json` harness output matching reference fixtures.

### 3. Memory Ladder & Host Doctor (`k3-doctor.sh`)
- Host machine preflight inspection (available RAM, NVMe `O_DIRECT` bandwidth, SIMD instructions).
- Presets: `ultra` (Jetson/ARM), `laptop` (8 GB), `desktop` (32 GB), `workstation` (96 GB), `server` (128 GB), `max` (224 GB).
- Interactive Memory Ladder exploring measured benchmarks from 8 GB to 224 GB RAM.
- Custom memory split tuner calculating pinned trunk layers, cache slots, projected Peak RSS, and safety margin (< 95% RAM).

### 4. MoE Cache & Belady Simulator (`tools/sim_cache.py`)
- Replay trace over 100,096 expert requests (`tests/fixtures/expert_trace.bin`).
- LRU eviction vs Belady clairvoyant MIN comparison.
- Visual heatmap of all 896 experts across layers showing active 3.7% vs dormant 96.3%.
- True resident hit rate vs naive prefetch hit counter analysis.

### 5. The 4 Reductions & Architecture Explorer
- Interactive MXFP4 nibble dequantizer: inspect 4-bit sign, exponent, and mantissa bits with shared E8M0 scale.
- Interactive Gate Ladder test runner: Gate 1 (Teacher forcing), Gate 2 (Greedy decode), Gate 3 (Incremental carry).

---

## Development & Build

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build production bundle
npm run build
```

## License

Licensed under the Apache License, Version 2.0.
