import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, bytesToText, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

const isPrintableByte = (b: number): boolean =>
  (b >= 0x20 && b < 0x7f) || b === 0x0a || b === 0x0d || b === 0x09;

const printableRatio = (bytes: Uint8Array): number => {
  if (bytes.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (isPrintableByte(bytes[i])) count++;
  }
  return count / bytes.length;
};

const parseInputLine = (line: string): Uint8Array => {
  const trimmed = line.trim();
  if (trimmed.length === 0) return new Uint8Array(0);
  const cleanedHex = trimmed.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  if (
    cleanedHex.length > 0 &&
    cleanedHex.length % 2 === 0 &&
    /^[0-9A-Fa-f]+$/.test(cleanedHex)
  ) {
    return parseHex(trimmed);
  }
  const parts = trimmed.split(/[\s,]+/).filter((s: string) => s.length > 0);
  if (parts.length > 0 && parts.every((s: string) => /^\d+$/.test(s))) {
    const nums: number[] = parts.map((s: string) => parseInt(s, 10));
    if (nums.every((n: number) => n >= 0 && n <= 255)) {
      return new Uint8Array(nums);
    }
  }
  return new TextEncoder().encode(trimmed);
};

const xorDecrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
};

const addConstDecrypt = (data: Uint8Array, key: number): Uint8Array => {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = (data[i] + key) & 0xff;
  }
  return result;
};

const subConstDecrypt = (data: Uint8Array, key: number): Uint8Array => {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = (data[i] - key) & 0xff;
  }
  return result;
};

const rc4Decrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) S[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    const tmp = S[i];
    S[i] = S[j];
    S[j] = tmp;
  }
  const result = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + S[i]) & 0xff;
    const tmp = S[i];
    S[i] = S[j];
    S[j] = tmp;
    result[k] = data[k] ^ S[(S[i] + S[j]) & 0xff];
  }
  return result;
};

const RC4_COMMON_KEYS = [
  'key', 'password', 'secret', 'admin', 'root', 'test', 'flag', 'ctf', 'hack',
  'pwn', 'reverse', 'crypto', '123456', '12345678', '1234567890', 'qwerty',
  'abc123', 'password1', 'iloveyou', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'sunshine', 'princess', 'shadow', 'superman', 'trustno1', '000000',
  '111111', '666666', '888888', 'abcdef', 'default', 'login', 'user', 'pass',
  'guest', 'home', 'network', 'internet', 'server', 'router', 'linux', 'windows',
  'android', 'apple', 'google', 'shellcode', 'exploit', 'buffer', 'overflow',
  'stack', 'heap', 'format', 'string', 'binary', 'hex', 'byte', 'xor', 'rc4',
  'aes', 'des', 'rsa', 'md5', 'sha1', 'sha256', 'base64', 'decode', 'encode',
  'encrypt', 'decrypt', 'key1', 'secretkey', 'mykey', 'passkey', 'apikey',
  'token', 'session', 'cookie', 'auth', 'bearer', 'jwt', 'debug', 'verbose',
  'trace', 'log', 'error', 'warning', 'info', 'debug1', 'test1', 'test123',
  'deadbeef', 'cafebabe', 'c0ffee', 'baadf00d', '8badf00d', 'feedface',
  'decafbad', 'deadfa11',
];

interface DecryptResult {
  plaintext: string;
  ratio: number;
  algorithm: string;
  key: string;
}

/* ---------- algorithm runners ---------- */

const bruteXor = (data: Uint8Array): DecryptResult[] => {
  const results: DecryptResult[] = [];
  // Single-byte XOR
  for (let keyByte = 0; keyByte < 256; keyByte++) {
    const key = new Uint8Array([keyByte]);
    const plain = xorDecrypt(data, key);
    results.push({
      plaintext: bytesToText(plain),
      ratio: printableRatio(plain),
      algorithm: 'XOR',
      key: `0x${keyByte.toString(16).padStart(2, '0')}`,
    });
  }
  // Multi-byte key via byte-position frequency analysis (key length 2-16)
  for (let keyLen = 2; keyLen <= 16; keyLen++) {
    if (data.length < keyLen * 2) continue;
    const key = new Uint8Array(keyLen);
    for (let pos = 0; pos < keyLen; pos++) {
      let bestScore = -1;
      let bestByte = 0;
      for (let candidate = 0; candidate < 256; candidate++) {
        let score = 0;
        let count = 0;
        for (let idx = pos; idx < data.length; idx += keyLen) {
          const dec = data[idx] ^ candidate;
          if (isPrintableByte(dec)) score++;
          count++;
        }
        if (count > 0 && score > bestScore) {
          bestScore = score;
          bestByte = candidate;
        }
      }
      key[pos] = bestByte;
    }
    const plain = xorDecrypt(data, key);
    results.push({
      plaintext: bytesToText(plain),
      ratio: printableRatio(plain),
      algorithm: 'XOR',
      key: bytesToHex(key),
    });
  }
  return results;
};

const bruteRc4 = (data: Uint8Array): DecryptResult[] => {
  const results: DecryptResult[] = [];
  for (const keyStr of RC4_COMMON_KEYS) {
    if (keyStr.length === 0) continue;
    const key = new TextEncoder().encode(keyStr);
    const plain = rc4Decrypt(data, key);
    results.push({
      plaintext: bytesToText(plain),
      ratio: printableRatio(plain),
      algorithm: 'RC4',
      key: keyStr,
    });
  }
  return results;
};

const bruteAddSub = (data: Uint8Array): DecryptResult[] => {
  const results: DecryptResult[] = [];
  for (let k = 0; k < 256; k++) {
    const addPlain = addConstDecrypt(data, k);
    results.push({
      plaintext: bytesToText(addPlain),
      ratio: printableRatio(addPlain),
      algorithm: 'ADD',
      key: `+0x${k.toString(16).padStart(2, '0')}`,
    });
    const subPlain = subConstDecrypt(data, k);
    results.push({
      plaintext: bytesToText(subPlain),
      ratio: printableRatio(subPlain),
      algorithm: 'SUB',
      key: `-0x${k.toString(16).padStart(2, '0')}`,
    });
  }
  return results;
};

const customDecrypt = (data: Uint8Array, expr: string): DecryptResult => {
  if (!expr.trim()) {
    throw new Error('自定义模式需要在密钥/表达式框中输入 JavaScript 表达式');
  }
  const fn = new Function('data', 'index', 'byte', `"use strict"; ${expr}`) as (
    d: Uint8Array,
    i: number,
    b: number,
  ) => number;
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = fn(data, i, data[i]) & 0xff;
  }
  return {
    plaintext: bytesToText(result),
    ratio: printableRatio(result),
    algorithm: 'CUSTOM',
    key: expr,
  };
};

/* ---------- main ---------- */

const decryptLine = (
  data: Uint8Array,
  algorithm: string,
  keyText: string,
): DecryptResult => {
  if (data.length === 0) {
    return { plaintext: '', ratio: 0, algorithm: 'none', key: '' };
  }

  if (algorithm === 'custom') {
    return customDecrypt(data, keyText);
  }

  if (algorithm === 'xor') {
    if (keyText.trim()) {
      const keyBytes = parseInputLine(keyText);
      if (keyBytes.length === 0) {
        throw new Error('XOR 密钥无法解析');
      }
      const plain = xorDecrypt(data, keyBytes);
      return {
        plaintext: bytesToText(plain),
        ratio: printableRatio(plain),
        algorithm: 'XOR',
        key: bytesToHex(keyBytes),
      };
    }
    const candidates = bruteXor(data);
    candidates.sort((a, b) => b.ratio - a.ratio);
    return candidates[0] ?? { plaintext: '', ratio: 0, algorithm: 'XOR', key: '' };
  }

  if (algorithm === 'rc4') {
    if (keyText.trim()) {
      const keyBytes = new TextEncoder().encode(keyText);
      const plain = rc4Decrypt(data, keyBytes);
      return {
        plaintext: bytesToText(plain),
        ratio: printableRatio(plain),
        algorithm: 'RC4',
        key: keyText,
      };
    }
    const candidates = bruteRc4(data);
    candidates.sort((a, b) => b.ratio - a.ratio);
    return candidates[0] ?? { plaintext: '', ratio: 0, algorithm: 'RC4', key: '' };
  }

  if (algorithm === 'add-sub') {
    const candidates = bruteAddSub(data);
    candidates.sort((a, b) => b.ratio - a.ratio);
    return candidates[0] ?? { plaintext: '', ratio: 0, algorithm: 'ADD/SUB', key: '' };
  }

  // auto: try all
  const all: DecryptResult[] = [
    ...bruteXor(data),
    ...bruteRc4(data),
    ...bruteAddSub(data),
  ];
  if (keyText.trim()) {
    try {
      all.push(customDecrypt(data, keyText));
    } catch {
      // ignore custom parse errors in auto mode
    }
  }
  all.sort((a, b) => b.ratio - a.ratio);
  return all[0] ?? { plaintext: '', ratio: 0, algorithm: 'unknown', key: '' };
};

const executeDecrypt = (input: string, params: Record<string, unknown>): string => {
  const algorithm: string = (params.algorithm as string) ?? 'auto';
  const keyText: string = (params.key as string) ?? '';
  const lines: string[] = input.split('\n');
  const results: string[] = [];
  let lineIndex = 0;
  for (const line of lines) {
    lineIndex++;
    const data = parseInputLine(line);
    if (data.length === 0) continue;
    const res = decryptLine(data, algorithm, keyText);
    const safePlain = res.plaintext.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    results.push(`── 行 ${lineIndex} ──`);
    results.push(`  长度: ${data.length} 字节`);
    results.push(`  算法: ${res.algorithm}`);
    results.push(`  密钥: ${res.key || '(无)'}`);
    results.push(`  可打印率: ${(res.ratio * 100).toFixed(1)}%`);
    results.push(`  结果: ${safePlain || '(空)'}`);
    results.push('');
  }
  if (results.length === 0) {
    return '未找到有效输入。请在每行输入一个加密的十六进制或字节数组。';
  }
  return results.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="字符串解密器"
    paramsConfig={[
      {
        name: 'algorithm',
        label: '算法',
        type: 'select',
        default: 'auto',
        options: [
          { value: 'auto', label: '自动检测' },
          { value: 'xor', label: 'XOR 暴力' },
          { value: 'rc4', label: 'RC4 爆破' },
          { value: 'add-sub', label: '加减常量' },
          { value: 'custom', label: '自定义表达式' },
        ],
      },
      {
        name: 'key',
        label: '密钥 / 表达式',
        type: 'text',
        default: '',
        placeholder: 'XOR/RC4密钥 或 JS表达式',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      executeDecrypt(input, params)
    }
  />
);
export default ToolComponent;
