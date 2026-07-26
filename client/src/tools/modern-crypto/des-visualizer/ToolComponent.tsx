import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const IP_TABLE = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
];

const FP_TABLE = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
];

const PC1_TABLE = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
];

const PC2_TABLE = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32,
];

const E_TABLE = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
];

const P_TABLE = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26,
  5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9,
  19, 13, 30, 6, 22, 11, 4, 25,
];

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const S_BOXES: number[][][] = [
  [[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],[0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],[4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],[15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]],
  [[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],[3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],[0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],[13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]],
  [[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],[13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],[13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],[1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]],
  [[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],[13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],[10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],[3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]],
  [[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],[14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],[4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],[11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]],
  [[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],[10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],[9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],[4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]],
  [[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],[13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],[1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],[6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]],
  [[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],[1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],[7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],[2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]],
];

const hexToBits = (hex: string): number[] => {
  const clean = hex.replace(/\s/g, '');
  const bits: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const nibble = parseInt(clean[i], 16);
    bits.push((nibble >> 3) & 1, (nibble >> 2) & 1, (nibble >> 1) & 1, nibble & 1);
  }
  return bits;
};

const bitsToHex = (bits: number[]): string => {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex.toUpperCase();
};

const permute = (bits: number[], table: number[]): number[] =>
  table.map((idx) => bits[idx - 1]);

const leftRotate = (bits: number[], n: number): number[] =>
  [...bits.slice(n), ...bits.slice(0, n)];

const generateSubKeys = (keyBits: number[]): number[][] => {
  const permuted = permute(keyBits, PC1_TABLE);
  let c = permuted.slice(0, 28);
  let d = permuted.slice(28, 56);
  const subkeys: number[][] = [];
  for (let i = 0; i < 16; i++) {
    c = leftRotate(c, SHIFTS[i]);
    d = leftRotate(d, SHIFTS[i]);
    const cd = [...c, ...d];
    subkeys.push(permute(cd, PC2_TABLE));
  }
  return subkeys;
};

const feistel = (r: number[], subkey: number[]): number[] => {
  const expanded = permute(r, E_TABLE);
  const xored = expanded.map((b, i) => b ^ subkey[i]);
  const output: number[] = [];
  for (let i = 0; i < 8; i++) {
    const chunk = xored.slice(i * 6, (i + 1) * 6);
    const row = (chunk[0] << 1) | chunk[5];
    const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const val = S_BOXES[i][row][col];
    output.push((val >> 3) & 1, (val >> 2) & 1, (val >> 1) & 1, val & 1);
  }
  return permute(output, P_TABLE);
};

const execute = (input: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) throw new Error('需要明文hex和密钥hex各一行');
  const plaintextHex = lines[0];
  const keyHex = lines[1];
  const ptBits = hexToBits(plaintextHex);
  const keyBits = hexToBits(keyHex);
  if (ptBits.length !== 64) throw new Error('明文必须为8字节(16 hex字符)');
  if (keyBits.length !== 64) throw new Error('密钥必须为8字节(16 hex字符)');

  const output: string[] = [];
  output.push('DES 加密过程可视化');
  output.push(`明文: ${plaintextHex.toUpperCase()}`);
  output.push(`密钥: ${keyHex.toUpperCase()}`);
  output.push('');

  const subkeys = generateSubKeys(keyBits);
  output.push('=== 子密钥生成 ===');
  subkeys.forEach((sk, i) => {
    output.push(`K${i + 1}: ${bitsToHex(sk)}`);
  });
  output.push('');

  const ipBits = permute(ptBits, IP_TABLE);
  output.push('=== 初始置换 IP ===');
  output.push(bitsToHex(ipBits));
  output.push('');

  let l = ipBits.slice(0, 32);
  let r = ipBits.slice(32, 64);

  output.push('=== 16轮 Feistel 网络 ===');
  for (let round = 0; round < 16; round++) {
    const fResult = feistel(r, subkeys[round]);
    const newR = l.map((b, i) => b ^ fResult[i]);
    output.push(`--- Round ${round + 1} ---`);
    output.push(`L${round + 1} = ${bitsToHex(r)}`);
    output.push(`R${round + 1} = ${bitsToHex(newR)}`);
    output.push(`K${round + 1} = ${bitsToHex(subkeys[round])}`);
    output.push('');
    l = r;
    r = newR;
  }

  const combined = [...r, ...l];
  const ciphertext = permute(combined, FP_TABLE);
  output.push('=== 最终置换 FP ===');
  output.push(bitsToHex(ciphertext));
  output.push('');
  output.push('=== 最终密文 ===');
  output.push(bitsToHex(ciphertext));
  return output.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="DES可视化"
    execute={(input: string) => execute(input)}
  />
);

export default ToolComponent;
