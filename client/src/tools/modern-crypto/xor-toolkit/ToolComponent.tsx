import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ENG_FREQ: Record<string, number> = {
  ' ': 13.0, e: 12.702, t: 9.056, a: 8.167, o: 7.507,
  i: 6.966, n: 6.749, s: 6.327, h: 6.094, r: 5.987,
  d: 4.253, l: 4.025, c: 2.782, u: 2.758, m: 2.406,
  w: 2.361, f: 2.228, g: 2.015, y: 1.974, p: 1.929,
  b: 1.492, v: 0.978, k: 0.772, j: 0.153, x: 0.150,
  q: 0.095, z: 0.074,
};

const scoreText = (bytes: Uint8Array): number => {
  let score = 0;
  for (const b of bytes) {
    const ch = String.fromCharCode(b).toLowerCase();
    if (ENG_FREQ[ch] !== undefined) {
      score += ENG_FREQ[ch];
    } else if (b >= 32 && b <= 126) {
      score += 0.1;
    } else if (b === 10 || b === 13) {
      score += 0.5;
    } else {
      score -= 5;
    }
  }
  return score;
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

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);

const singleByte = (input: string): string => {
  const cipher = hexToBytes(input.trim());
  const results: { key: number; score: number; text: string }[] = [];
  for (let key = 0; key < 256; key++) {
    const decrypted = new Uint8Array(cipher.length);
    for (let i = 0; i < cipher.length; i++) {
      decrypted[i] = cipher[i] ^ key;
    }
    const score = scoreText(decrypted);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(decrypted);
    results.push({ key, score, text });
  }
  results.sort((a, b) => b.score - a.score);
  const lines: string[] = ['=== 单字节 XOR 暴力破解 (Top 10) ===', ''];
  for (const r of results.slice(0, 10)) {
    lines.push(`key=0x${r.key.toString(16).padStart(2, '0')} (${r.key.toString().padStart(3)}) | score=${r.score.toFixed(1)} | "${r.text}"`);
  }
  return lines.join('\n');
};

const cribDrag = (input: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) throw new Error('需要两行: 密文hex, crib文本');
  const cipher = hexToBytes(lines[0]);
  const crib = strToBytes(lines[1]);
  const results: string[] = ['=== XOR Crib Dragging ===', ''];
  for (let pos = 0; pos <= cipher.length - crib.length; pos++) {
    const key: number[] = [];
    for (let i = 0; i < crib.length; i++) {
      key.push(cipher[pos + i] ^ crib[i]);
    }
    const fullDecrypt = new Uint8Array(cipher.length);
    for (let i = 0; i < cipher.length; i++) {
      fullDecrypt[i] = cipher[i] ^ key[i % key.length];
    }
    const decStr = Array.from(fullDecrypt).map((b) =>
      (b >= 32 && b < 127) ? String.fromCharCode(b) : '.',
    ).join('');
    results.push(`pos ${pos.toString().padStart(3)}: key=${bytesToHex(new Uint8Array(key))}`);
    results.push(`         解密: ${decStr}`);
    results.push('');
  }
  return results.join('\n');
};

const multiXor = (input: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) throw new Error('至少需要2行hex密文');
  const ciphers = lines.map((l) => hexToBytes(l));
  const lines2: string[] = ['=== 多段 XOR 对比分析 ===', ''];
  const minLen = Math.min(...ciphers.map((c) => c.length));
  for (let i = 0; i < ciphers.length; i++) {
    for (let j = i + 1; j < ciphers.length; j++) {
      const xored = new Uint8Array(minLen);
      for (let k = 0; k < minLen; k++) {
        xored[k] = ciphers[i][k] ^ ciphers[j][k];
      }
      lines2.push(`C[${i}] XOR C[${j}]:`);
      lines2.push(`  hex: ${bytesToHex(xored)}`);
      const text = Array.from(xored).map((b) =>
        (b >= 32 && b < 127) ? String.fromCharCode(b) : '.',
      ).join('');
      lines2.push(`  ascii: ${text}`);
      lines2.push('');
    }
  }
  lines2.push('提示: 两段密文 XOR = 两段明文 XOR');
  lines2.push('若其中一段已知(crib), 可恢复另一段');
  return lines2.join('\n');
};

const hammingDistance = (a: Uint8Array, b: Uint8Array): number => {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let xor = a[i] ^ b[i];
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
};

const repeatKey = (input: string): string => {
  const cipher = hexToBytes(input.trim());
  if (cipher.length < 8) throw new Error('密文太短');
  const lines: string[] = ['=== 重复密钥 XOR 破解 ===', ''];
  const keyScores: { keyLen: number; score: number }[] = [];
  for (let keyLen = 2; keyLen <= Math.min(40, cipher.length / 4); keyLen++) {
    const blocks = Math.floor(cipher.length / keyLen);
    if (blocks < 2) break;
    let totalDist = 0;
    let pairs = 0;
    for (let i = 0; i < blocks - 1; i++) {
      const block1 = cipher.slice(i * keyLen, (i + 1) * keyLen);
      const block2 = cipher.slice((i + 1) * keyLen, (i + 2) * keyLen);
      totalDist += hammingDistance(block1, block2);
      pairs++;
    }
    const normalized = totalDist / pairs / keyLen;
    keyScores.push({ keyLen, score: normalized });
  }
  keyScores.sort((a, b) => a.score - b.score);
  lines.push('密钥长度估计 (Hamming距离归一化, 越小越可能):');
  for (const ks of keyScores.slice(0, 5)) {
    lines.push(`  长度 ${ks.keyLen.toString().padStart(2)}: ${ks.score.toFixed(4)}`);
  }
  const bestKeyLen = keyScores[0].keyLen;
  lines.push('');
  lines.push(`最可能密钥长度: ${bestKeyLen}`);
  lines.push('');

  const keyBytes: number[] = [];
  for (let pos = 0; pos < bestKeyLen; pos++) {
    const group: number[] = [];
    for (let i = pos; i < cipher.length; i += bestKeyLen) {
      group.push(cipher[i]);
    }
    let bestScore = -Infinity;
    let bestByte = 0;
    for (let k = 0; k < 256; k++) {
      const decrypted = new Uint8Array(group.length);
      for (let i = 0; i < group.length; i++) {
        decrypted[i] = group[i] ^ k;
      }
      const score = scoreText(decrypted);
      if (score > bestScore) {
        bestScore = score;
        bestByte = k;
      }
    }
    keyBytes.push(bestByte);
  }
  const keyHex = bytesToHex(new Uint8Array(keyBytes));
  const keyStr = Array.from(keyBytes).map((b) =>
    (b >= 32 && b < 127) ? String.fromCharCode(b) : '.',
  ).join('');
  lines.push(`恢复密钥: ${keyHex}`);
  lines.push(`密钥 ASCII: ${keyStr}`);
  lines.push('');

  const decrypted = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    decrypted[i] = cipher[i] ^ keyBytes[i % keyBytes.length];
  }
  const decStr = new TextDecoder('utf-8', { fatal: false }).decode(decrypted);
  lines.push('解密结果:');
  lines.push(decStr);
  return lines.join('\n');
};

const execute = (input: string, mode: string): string => {
  switch (mode) {
    case 'single-byte':
      return singleByte(input);
    case 'crib-drag':
      return cribDrag(input);
    case 'multi-xor':
      return multiXor(input);
    case 'repeat-key':
      return repeatKey(input);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="XOR综合分析"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'single-byte')
    }
    modeOptions={[
      { value: 'single-byte', label: '单字节暴力' },
      { value: 'crib-drag', label: '已知明文' },
      { value: 'multi-xor', label: '多段对比' },
      { value: 'repeat-key', label: '重复key破解' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'single-byte', options: [
        { value: 'single-byte', label: '单字节暴力' },
        { value: 'crib-drag', label: '已知明文' },
        { value: 'multi-xor', label: '多段对比' },
        { value: 'repeat-key', label: '重复key破解' },
      ] },
    ]}
  />
);

export default ToolComponent;
