import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);

const rotr32 = (x: number, n: number): number => {
  x = x >>> 0;
  return ((x >>> n) | (x << (32 - n))) >>> 0;
};

const rotl32 = (x: number, n: number): number => {
  x = x >>> 0;
  return ((x << n) | (x >>> (32 - n))) >>> 0;
};

const md5Padding = (msgLenBytes: number): Uint8Array => {
  const bitLen = BigInt(msgLenBytes) * 8n;
  const mod = msgLenBytes % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const result = new Uint8Array(padLen + 8);
  result[0] = 0x80;
  const dv = new DataView(result.buffer);
  const lo = Number(bitLen & 0xffffffffn);
  const hi = Number((bitLen >> 32n) & 0xffffffffn);
  dv.setUint32(padLen, lo, true);
  dv.setUint32(padLen + 4, hi, true);
  return result;
};

const md5ProcessBlock = (state: Uint32Array, block: Uint8Array): void => {
  const x = new Uint32Array(16);
  const dv = new DataView(block.buffer);
  for (let i = 0; i < 16; i++) {
    x[i] = dv.getUint32(i * 4, true);
  }
  let [a, b, c, d] = [state[0], state[1], state[2], state[3]];

  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);

  const s = [
    7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21,
  ];
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  for (let i = 0; i < 64; i++) {
    let f: number;
    let g: number;
    if (i < 16) {
      f = F(b, c, d);
      g = i;
    } else if (i < 32) {
      f = G(b, c, d);
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = H(b, c, d);
      g = (3 * i + 5) % 16;
    } else {
      f = I(b, c, d);
      g = (7 * i) % 16;
    }
    f = (f + a + K[i] + x[g]) >>> 0;
    a = d;
    d = c;
    c = b;
    b = (b + rotl32(f, s[(i >> 4) * 4 + (i % 4)])) >>> 0;
  }
  state[0] = (state[0] + a) >>> 0;
  state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0;
  state[3] = (state[3] + d) >>> 0;
};

const md5Extend = (origHash: string, origLen: number, append: Uint8Array): string => {
  const state = new Uint32Array(4);
  for (let i = 0; i < 4; i++) {
    state[i] = parseInt(origHash.slice(i * 8, (i + 1) * 8), 16) >>> 0;
  }
  const padding = md5Padding(origLen);
  const totalProcessed = origLen + padding.length;
  const newBitLen = BigInt(totalProcessed + append.length) * 8n;
  const mod = (totalProcessed + append.length) % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const fullExtPadding = new Uint8Array(padLen + 8);
  fullExtPadding[0] = 0x80;
  const dv = new DataView(fullExtPadding.buffer);
  dv.setUint32(padLen, Number(newBitLen & 0xffffffffn), true);
  dv.setUint32(padLen + 4, Number((newBitLen >> 32n) & 0xffffffffn), true);

  const msg = new Uint8Array(append.length + fullExtPadding.length);
  msg.set(append, 0);
  msg.set(fullExtPadding, append.length);

  let offset = 0;
  while (offset + 64 <= msg.length) {
    md5ProcessBlock(state, msg.slice(offset, offset + 64));
    offset += 64;
  }
  const result = new Uint8Array(16);
  const rdv = new DataView(result.buffer);
  for (let i = 0; i < 4; i++) {
    rdv.setUint32(i * 4, state[i], true);
  }
  return bytesToHex(result);
};

const sha1Padding = (msgLenBytes: number): Uint8Array => {
  const bitLen = BigInt(msgLenBytes) * 8n;
  const mod = msgLenBytes % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const result = new Uint8Array(padLen + 8);
  result[0] = 0x80;
  const dv = new DataView(result.buffer);
  dv.setUint32(padLen, Number((bitLen >> 32n) & 0xffffffffn), false);
  dv.setUint32(padLen + 4, Number(bitLen & 0xffffffffn), false);
  return result;
};

const sha1ProcessBlock = (state: Uint32Array, block: Uint8Array): void => {
  const w = new Uint32Array(80);
  const dv = new DataView(block.buffer);
  for (let i = 0; i < 16; i++) {
    w[i] = dv.getUint32(i * 4, false);
  }
  for (let i = 16; i < 80; i++) {
    w[i] = rotr32(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
  }
  let [a, b, c, d, e] = [state[0], state[1], state[2], state[3], state[4]];
  for (let i = 0; i < 80; i++) {
    let f: number;
    let k: number;
    if (i < 20) {
      f = (b & c) | (~b & d);
      k = 0x5a827999;
    } else if (i < 40) {
      f = b ^ c ^ d;
      k = 0x6ed9eba1;
    } else if (i < 60) {
      f = (b & c) | (b & d) | (c & d);
      k = 0x8f1bbcdc;
    } else {
      f = b ^ c ^ d;
      k = 0xca62c1d6;
    }
    const temp = (rotr32(a, 5) + f + e + k + w[i]) >>> 0;
    e = d;
    d = c;
    c = rotr32(b, 30);
    b = a;
    a = temp;
  }
  state[0] = (state[0] + a) >>> 0;
  state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0;
  state[3] = (state[3] + d) >>> 0;
  state[4] = (state[4] + e) >>> 0;
};

const sha1Extend = (origHash: string, origLen: number, append: Uint8Array): string => {
  const state = new Uint32Array(5);
  for (let i = 0; i < 5; i++) {
    state[i] = parseInt(origHash.slice(i * 8, (i + 1) * 8), 16) >>> 0;
  }
  const padding = sha1Padding(origLen);
  const totalProcessed = origLen + padding.length;
  const newBitLen = BigInt(totalProcessed + append.length) * 8n;
  const mod = (totalProcessed + append.length) % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const fullExtPadding = new Uint8Array(padLen + 8);
  fullExtPadding[0] = 0x80;
  const dv = new DataView(fullExtPadding.buffer);
  dv.setUint32(padLen, Number((newBitLen >> 32n) & 0xffffffffn), false);
  dv.setUint32(padLen + 4, Number(newBitLen & 0xffffffffn), false);

  const msg = new Uint8Array(append.length + fullExtPadding.length);
  msg.set(append, 0);
  msg.set(fullExtPadding, append.length);

  let offset = 0;
  while (offset + 64 <= msg.length) {
    sha1ProcessBlock(state, msg.slice(offset, offset + 64));
    offset += 64;
  }
  return Array.from(state).map((s) => s.toString(16).padStart(8, '0')).join('');
};

const sha256Padding = (msgLenBytes: number): Uint8Array => {
  const bitLen = BigInt(msgLenBytes) * 8n;
  const mod = msgLenBytes % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const result = new Uint8Array(padLen + 8);
  result[0] = 0x80;
  const dv = new DataView(result.buffer);
  dv.setUint32(padLen, Number((bitLen >> 32n) & 0xffffffffn), false);
  dv.setUint32(padLen + 4, Number(bitLen & 0xffffffffn), false);
  return result;
};

const K256: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const sha256ProcessBlock = (state: Uint32Array, block: Uint8Array): void => {
  const w = new Uint32Array(64);
  const dv = new DataView(block.buffer);
  for (let i = 0; i < 16; i++) {
    w[i] = dv.getUint32(i * 4, false);
  }
  for (let i = 16; i < 64; i++) {
    const s0 = rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
    const s1 = rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
    w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
  }
  let [a, b, c, d, e, f, g, h] = [
    state[0], state[1], state[2], state[3], state[4], state[5], state[6], state[7],
  ];
  for (let i = 0; i < 64; i++) {
    const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
    const ch = (e & f) ^ (~e & g);
    const temp1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
    const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const temp2 = (S0 + maj) >>> 0;
    h = g;
    g = f;
    f = e;
    e = (d + temp1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (temp1 + temp2) >>> 0;
  }
  state[0] = (state[0] + a) >>> 0;
  state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0;
  state[3] = (state[3] + d) >>> 0;
  state[4] = (state[4] + e) >>> 0;
  state[5] = (state[5] + f) >>> 0;
  state[6] = (state[6] + g) >>> 0;
  state[7] = (state[7] + h) >>> 0;
};

const sha256Extend = (origHash: string, origLen: number, append: Uint8Array): string => {
  const state = new Uint32Array(8);
  for (let i = 0; i < 8; i++) {
    state[i] = parseInt(origHash.slice(i * 8, (i + 1) * 8), 16) >>> 0;
  }
  const padding = sha256Padding(origLen);
  const totalProcessed = origLen + padding.length;
  const newBitLen = BigInt(totalProcessed + append.length) * 8n;
  const mod = (totalProcessed + append.length) % 64;
  const padLen = mod < 56 ? 56 - mod : 120 - mod;
  const fullExtPadding = new Uint8Array(padLen + 8);
  fullExtPadding[0] = 0x80;
  const dv = new DataView(fullExtPadding.buffer);
  dv.setUint32(padLen, Number((newBitLen >> 32n) & 0xffffffffn), false);
  dv.setUint32(padLen + 4, Number(newBitLen & 0xffffffffn), false);

  const msg = new Uint8Array(append.length + fullExtPadding.length);
  msg.set(append, 0);
  msg.set(fullExtPadding, append.length);

  let offset = 0;
  while (offset + 64 <= msg.length) {
    sha256ProcessBlock(state, msg.slice(offset, offset + 64));
    offset += 64;
  }
  return Array.from(state).map((s) => s.toString(16).padStart(8, '0')).join('');
};

const execute = (input: string, mode: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim());
  if (lines.length < 3) throw new Error('需要3行: 原始hash, 原始数据长度, 追加数据');
  const origHash = lines[0].trim();
  const origLen = parseInt(lines[1].trim(), 10);
  const appendData = lines.slice(2).join('\n');
  const append = strToBytes(appendData);

  let newHash: string;
  let padding: Uint8Array;

  switch (mode) {
    case 'md5': {
      if (origHash.length !== 32) throw new Error('MD5 hash应为32个hex字符');
      newHash = md5Extend(origHash, origLen, append);
      padding = md5Padding(origLen);
      break;
    }
    case 'sha1': {
      if (origHash.length !== 40) throw new Error('SHA-1 hash应为40个hex字符');
      newHash = sha1Extend(origHash, origLen, append);
      padding = sha1Padding(origLen);
      break;
    }
    case 'sha256': {
      if (origHash.length !== 64) throw new Error('SHA-256 hash应为64个hex字符');
      newHash = sha256Extend(origHash, origLen, append);
      padding = sha256Padding(origLen);
      break;
    }
    default:
      return '未知模式';
  }

  const payload = new Uint8Array(padding.length + append.length);
  payload.set(padding, 0);
  payload.set(append, padding.length);

  return [
    `=== 哈希长度扩展攻击 (${mode.toUpperCase()}) ===`,
    `原始 hash: ${origHash}`,
    `原始数据长度: ${origLen} 字节`,
    `追加数据: ${appendData}`,
    ``,
    `原始 padding: ${bytesToHex(padding)}`,
    ``,
    `构造的 payload (padding + append):`,
    bytesToHex(payload),
    ``,
    `新 hash: ${newHash}`,
    ``,
    `说明: 服务器收到 payload 后计算 H(secret + payload) = ${newHash}`,
    `原始数据 + padding 长度 = ${origLen + padding.length} 字节`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="哈希长度扩展攻击"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'md5')
    }
    modeOptions={[
      { value: 'md5', label: 'MD5' },
      { value: 'sha1', label: 'SHA-1' },
      { value: 'sha256', label: 'SHA-256' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '哈希', type: 'select', default: 'md5', options: [
        { value: 'md5', label: 'MD5' },
        { value: 'sha1', label: 'SHA-1' },
        { value: 'sha256', label: 'SHA-256' },
      ] },
    ]}
  />
);

export default ToolComponent;
