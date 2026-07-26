import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const SBOX: number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

const RCON: number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

const xtime = (x: number): number => {
  const h = x & 0x80;
  let r = (x << 1) & 0xff;
  if (h) r ^= 0x1b;
  return r;
};

const gfMul = (a: number, b: number): number => {
  let result = 0;
  let bb = b;
  let aa = a;
  for (let i = 0; i < 8; i++) {
    if (bb & 1) result ^= aa;
    const h = aa & 0x80;
    aa = (aa << 1) & 0xff;
    if (h) aa ^= 0x1b;
    bb >>= 1;
  }
  return result;
};

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

type State = number[][];

const bytesToState = (bytes: Uint8Array): State => {
  const state: State = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      state[r][c] = bytes[c * 4 + r];
    }
  }
  return state;
};

const stateToHex = (state: State): string => {
  const lines: string[] = [];
  for (let r = 0; r < 4; r++) {
    lines.push(state[r].map((b) => b.toString(16).padStart(2, '0')).join(' '));
  }
  return lines.join('\n');
};

const subBytes = (state: State): State =>
  state.map((row) => row.map((b) => SBOX[b]));

const shiftRows = (state: State): State => {
  const result: State = state.map((row) => [...row]);
  for (let r = 1; r < 4; r++) {
    const tmp = [...result[r]];
    for (let c = 0; c < 4; c++) {
      result[r][c] = tmp[(c + r) % 4];
    }
  }
  return result;
};

const mixColumns = (state: State): State => {
  const result: State = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (let c = 0; c < 4; c++) {
    const s0 = state[0][c];
    const s1 = state[1][c];
    const s2 = state[2][c];
    const s3 = state[3][c];
    result[0][c] = gfMul(2, s0) ^ gfMul(3, s1) ^ s2 ^ s3;
    result[1][c] = s0 ^ gfMul(2, s1) ^ gfMul(3, s2) ^ s3;
    result[2][c] = s0 ^ s1 ^ gfMul(2, s2) ^ gfMul(3, s3);
    result[3][c] = gfMul(3, s0) ^ s1 ^ s2 ^ gfMul(2, s3);
  }
  return result;
};

const addRoundKey = (state: State, roundKey: Uint8Array): State => {
  const result: State = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      result[r][c] = state[r][c] ^ roundKey[c * 4 + r];
    }
  }
  return result;
};

const keyExpansion = (key: Uint8Array, rounds: number): Uint8Array[] => {
  const keyLen = key.length;
  const totalWords = 4 * (rounds + 1);
  const w: number[][] = [];
  for (let i = 0; i < keyLen / 4; i++) {
    w.push([key[i * 4], key[i * 4 + 1], key[i * 4 + 2], key[i * 4 + 3]]);
  }
  for (let i = keyLen / 4; i < totalWords; i++) {
    let temp = [...w[i - 1]];
    if (i % (keyLen / 4) === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]];
      temp = temp.map((b) => SBOX[b]);
      temp[0] ^= RCON[i / (keyLen / 4) - 1];
    } else if (keyLen === 32 && i % 8 === 4) {
      temp = temp.map((b) => SBOX[b]);
    }
    w.push(w[i - keyLen / 4].map((b, j) => b ^ temp[j]));
  }
  const roundKeys: Uint8Array[] = [];
  for (let r = 0; r <= rounds; r++) {
    const rk = new Uint8Array(16);
    for (let c = 0; c < 4; c++) {
      for (let j = 0; j < 4; j++) {
        rk[c * 4 + j] = w[r * 4 + c][j];
      }
    }
    roundKeys.push(rk);
  }
  return roundKeys;
};

const execute = (input: string, params: Record<string, unknown>): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) throw new Error('需要明文hex和密钥hex各一行');
  const plaintext = hexToBytes(lines[0]);
  const key = hexToBytes(lines[1]);
  const keySize = (params['key-size'] as string) || '128';
  const rounds = keySize === '128' ? 10 : keySize === '192' ? 12 : 14;
  if (plaintext.length !== 16) throw new Error('明文必须为16字节(32 hex字符)');
  if (key.length !== parseInt(keySize) / 8) throw new Error(`密钥必须为${parseInt(keySize) / 8}字节`);

  const output: string[] = [];
  output.push(`AES-${keySize} 加密过程可视化`);
  output.push(`轮数: ${rounds}`);
  if (keySize !== '128') {
    output.push(`注意: 仅AES-128完整实现，AES-${keySize}展示轮数`);
  }
  output.push('');

  const roundKeys = keyExpansion(key, rounds);
  let state = bytesToState(plaintext);

  output.push('初始状态:');
  output.push(stateToHex(state));
  output.push('');

  output.push('AddRoundKey (Round 0):');
  state = addRoundKey(state, roundKeys[0]);
  output.push(stateToHex(state));
  output.push('');

  const actualRounds = keySize === '128' ? rounds : 10;
  for (let round = 1; round <= actualRounds; round++) {
    output.push(`--- Round ${round} ---`);
    output.push('SubBytes:');
    state = subBytes(state);
    output.push(stateToHex(state));
    output.push('');
    output.push('ShiftRows:');
    state = shiftRows(state);
    output.push(stateToHex(state));
    output.push('');
    if (round < actualRounds) {
      output.push('MixColumns:');
      state = mixColumns(state);
      output.push(stateToHex(state));
      output.push('');
    }
    output.push('AddRoundKey:');
    state = addRoundKey(state, roundKeys[round]);
    output.push(stateToHex(state));
    output.push('');
  }

  const ciphertext = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      ciphertext[c * 4 + r] = state[r][c];
    }
  }
  output.push('=== 最终密文 ===');
  output.push(bytesToHex(ciphertext));
  return output.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="AES可视化"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, params)
    }
    paramsConfig={[
      { name: 'key-size', label: '密钥长度', type: 'select', default: '128', options: [
        { value: '128', label: 'AES-128' },
        { value: '192', label: 'AES-192' },
        { value: '256', label: 'AES-256' },
      ] },
    ]}
  />
);

export default ToolComponent;
