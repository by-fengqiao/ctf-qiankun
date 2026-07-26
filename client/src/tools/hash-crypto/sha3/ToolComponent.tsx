import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// FIPS 202 SHA-3 implementation using BigInt 64-bit lanes
const MASK64 = (1n << 64n) - 1n;

const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTC: number[] = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14,
  27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

const PILN: number[] = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4,
  15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

function rotl64(x: bigint, n: number): bigint {
  const bn = BigInt(n);
  return ((x << bn) | (x >> (64n - bn))) & MASK64;
}

function keccakF(state: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    // Theta
    const C: bigint[] = new Array(5);
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      const D = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) {
        state[y + x] ^= D;
      }
    }

    // Rho + Pi
    let t = state[1];
    for (let i = 0; i < 24; i++) {
      const j = PILN[i];
      const tmp = state[j];
      state[j] = rotl64(t, ROTC[i]);
      t = tmp;
    }

    // Chi
    for (let y = 0; y < 25; y += 5) {
      const t0 = state[y];
      const t1 = state[y + 1];
      const t2 = state[y + 2];
      const t3 = state[y + 3];
      const t4 = state[y + 4];
      state[y] = t0 ^ ((~t1 & MASK64) & t2);
      state[y + 1] = t1 ^ ((~t2 & MASK64) & t3);
      state[y + 2] = t2 ^ ((~t3 & MASK64) & t4);
      state[y + 3] = t3 ^ ((~t4 & MASK64) & t0);
      state[y + 4] = t4 ^ ((~t0 & MASK64) & t1);
    }

    // Iota
    state[0] ^= RC[round];
  }
}

function sha3(input: Uint8Array, outputBits: number): string {
  const rate = 200 - (outputBits / 4); // rate in bytes: 1600 - 2*capacity, capacity=2*outputBits
  const rateBytes = rate; // already in bytes since (200 - outputBits/4)
  const state: bigint[] = new Array(25).fill(0n);

  // Absorb
  let offset = 0;
  const inputLen = input.length;

  while (offset < inputLen) {
    const chunkLen = Math.min(rateBytes, inputLen - offset);
    // XOR input bytes into state (little-endian lanes)
    for (let i = 0; i < chunkLen; i++) {
      const laneIdx = Math.floor(i / 8);
      const byteIdx = i % 8;
      state[laneIdx] ^= BigInt(input[offset + i]) << BigInt(byteIdx * 8);
    }
    offset += rateBytes;
    if (chunkLen === rateBytes) {
      keccakF(state);
    }
  }

  // Padding: FIPS 202 uses 0x06 ... 0x80
  const padOffset = inputLen % rateBytes;
  state[Math.floor(padOffset / 8)] ^= 0x06n << BigInt((padOffset % 8) * 8);
  state[Math.floor((rateBytes - 1) / 8)] ^= 0x80n << BigInt(((rateBytes - 1) % 8) * 8);
  keccakF(state);

  // Squeeze
  const outBytes = outputBits / 8;
  const result: number[] = [];
  for (let i = 0; i < outBytes; i++) {
    const laneIdx = Math.floor(i / 8);
    const byteIdx = i % 8;
    result.push(Number((state[laneIdx] >> BigInt(byteIdx * 8)) & 0xFFn));
  }
  return result.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'outputLength',
        label: '输出长度',
        type: 'select',
        default: '256',
        options: [
          { value: '224', label: '224' },
          { value: '256', label: '256' },
          { value: '384', label: '384' },
          { value: '512', label: '512' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const len = parseInt((params.outputLength as string) ?? '256', 10);
      const inputBytes = new TextEncoder().encode(input);
      return sha3(inputBytes, len);
    }}
  />
);
export default ToolComponent;
