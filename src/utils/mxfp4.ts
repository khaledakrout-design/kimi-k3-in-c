/**
 * MXFP4 (Microscaling FP4 - E2M1 with E8M0 shared scale per 32 elements)
 * Exact format used in Kimi K3 MoE routed experts.
 */

// E2M1 lookup table for the 16 4-bit values (indices 0 to 15)
export const E2M1_TABLE = [
  0.0,   // 0000: +0
  0.5,   // 0001: +0.5 (subnormal: 0 * 2^-1 + 1 * 2^-1 = 0.5)
  1.0,   // 0010: +1.0 (normalized: (1 + 0/2) * 2^0 = 1.0)
  1.5,   // 0011: +1.5 (normalized: (1 + 1/2) * 2^0 = 1.5)
  2.0,   // 0100: +2.0 (normalized: (1 + 0/2) * 2^1 = 2.0)
  3.0,   // 0101: +3.0 (normalized: (1 + 1/2) * 2^1 = 3.0)
  4.0,   // 0110: +4.0 (normalized: (1 + 0/2) * 2^2 = 4.0)
  6.0,   // 0111: +6.0 (normalized: (1 + 1/2) * 2^2 = 6.0)
  -0.0,  // 1000: -0
  -0.5,  // 1001: -0.5
  -1.0,  // 1010: -1.0
  -1.5,  // 1011: -1.5
  -2.0,  // 1100: -2.0
  -3.0,  // 1101: -3.0
  -4.0,  // 1110: -4.0
  -6.0   // 1111: -6.0
];

export interface NibbleInfo {
  index: number;
  nibbleBinary: string;
  sign: number;
  exponentBits: string;
  mantissaBits: string;
  unscaledValue: number;
  scaleFactor: number;
  finalFloat32: number;
}

/**
 * Dequantizes a single 4-bit nibble with an 8-bit unsigned E8M0 scale byte.
 * scale = 2^(e8m0_scale - 127)
 */
export function dequantizeNibble(nibble: number, e8m0ScaleByte: number): NibbleInfo {
  const cleanNibble = nibble & 0x0f;
  const sign = (cleanNibble >> 3) & 1;
  const exp = (cleanNibble >> 1) & 3;
  const mantissa = cleanNibble & 1;
  
  const unscaled = E2M1_TABLE[cleanNibble];
  const exponentPower = e8m0ScaleByte - 127;
  const scale = Math.pow(2, exponentPower);
  const finalVal = unscaled * scale;

  return {
    index: cleanNibble,
    nibbleBinary: cleanNibble.toString(2).padStart(4, '0'),
    sign,
    exponentBits: exp.toString(2).padStart(2, '0'),
    mantissaBits: mantissa.toString(2),
    unscaledValue: unscaled,
    scaleFactor: scale,
    finalFloat32: finalVal
  };
}

/**
 * Unpacks a 32-element MXFP4 block: 16 bytes containing 32 nibbles, plus 1 E8M0 scale byte.
 */
export function unpackMxfp4Block(bytes16: Uint8Array, scaleByte: number): NibbleInfo[] {
  const result: NibbleInfo[] = [];
  for (let i = 0; i < bytes16.length; i++) {
    const byte = bytes16[i];
    const lowNibble = byte & 0x0f;
    const highNibble = (byte >> 4) & 0x0f;
    result.push(dequantizeNibble(lowNibble, scaleByte));
    result.push(dequantizeNibble(highNibble, scaleByte));
  }
  return result;
}
