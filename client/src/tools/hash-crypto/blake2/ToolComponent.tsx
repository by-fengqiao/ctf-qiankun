import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// BLAKE2b implementation using BigInt 64-bit arithmetic
const MASK64 = (1n << 64n) - 1n;

const IV: bigint[] = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

const SIGMA: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
];

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}

function G(v: bigint[], a: number, b: number, c: number, d: number, x: bigint, y: bigint): void {
  v[a] = (v[a] + v[b] + x) & MASK64;
  v[d] = rotr64(v[d] ^ v[a], 32n);
  v[c] = (v[c] + v[d]) & MASK64;
  v[b] = rotr64(v[b] ^ v[c], 24n);
  v[a] = (v[a] + v[b] + y) & MASK64;
  v[d] = rotr64(v[d] ^ v[a], 16n);
  v[c] = (v[c] + v[d]) & MASK64;
  v[b] = rotr64(v[b] ^ v[c], 63n);
}

function compress(h: bigint[], block: Uint8Array, t: bigint, last: boolean): void {
  const m: bigint[] = new Array(16);
  for (let i = 0; i < 16; i++) {
    let word = 0n;
    for (let j = 7; j >= 0; j--) {
      word = (word << 8n) | BigInt(block[i * 8 + j]);
    }
    m[i] = word;
  }

  const v: bigint[] = new Array(16);
  for (let i = 0; i < 8; i++) {
    v[i] = h[i];
    v[i + 8] = IV[i];
  }
  v[12] ^= t & MASK64;
  v[13] ^= (t >> 64n) & MASK64;
  if (last) v[14] ^= MASK64;

  for (let round = 0; round < 12; round++) {
    const s = SIGMA[round];
    G(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
    G(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
    G(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
    G(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
    G(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
    G(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
    G(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
    G(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
  }

  for (let i = 0; i < 8; i++) {
    h[i] ^= v[i] ^ v[i + 8];
  }
}

function blake2b(input: Uint8Array, outLen: number): string {
  const h: bigint[] = IV.slice();
  // Parameter block: digest_length | key_length=0 | fanout=1 | depth=1
  h[0] ^= BigInt(0x01010000 | outLen);

  const blockSize = 128;
  const totalLen = input.length;
  let offset = 0;
  let bytesCompressed = 0n;

  if (totalLen === 0) {
    // Empty input: single final block of zeros
    const block = new Uint8Array(blockSize);
    compress(h, block, 0n, true);
  } else {
    while (offset < totalLen) {
      const remaining = totalLen - offset;
      const isLast = remaining <= blockSize;
      const block = new Uint8Array(blockSize);
      const chunkLen = Math.min(remaining, blockSize);
      block.set(input.subarray(offset, offset + chunkLen));
      bytesCompressed += BigInt(chunkLen);
      compress(h, block, bytesCompressed, isLast);
      offset += blockSize;
    }
  }

  // Output
  const outBytes: number[] = [];
  for (let i = 0; i < outLen; i++) {
    const wordIdx = Math.floor(i / 8);
    const byteIdx = i % 8;
    outBytes.push(Number((h[wordIdx] >> BigInt(byteIdx * 8)) & 0xFFn));
  }
  return outBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
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
          { value: '256', label: '256' },
          { value: '512', label: '512' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const len = parseInt((params.outputLength as string) ?? '256', 10);
      const outBytes = len / 8;
      const inputBytes = new TextEncoder().encode(input);
      return blake2b(inputBytes, outBytes);
    }}
  />
);
export default ToolComponent;
