import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ENG_FREQ: Record<string, number> = {
  a: 8.167, b: 1.492, c: 2.782, d: 4.253, e: 12.702,
  f: 2.228, g: 2.015, h: 6.094, i: 6.966, j: 0.153,
  k: 0.772, l: 4.025, m: 2.406, n: 6.749, o: 7.507,
  p: 1.929, q: 0.095, r: 5.987, s: 6.327, t: 9.056,
  u: 2.758, v: 0.978, w: 2.361, x: 0.150, y: 1.974,
  z: 0.074,
};

const bigGcd = (a: number, b: number): number => {
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

const computeIC = (text: string): number => {
  const letters = text.toLowerCase().replace(/[^a-z]/g, '');
  const n = letters.length;
  if (n < 2) return 0;
  const freq: Record<string, number> = {};
  for (const c of letters) {
    freq[c] = (freq[c] || 0) + 1;
  }
  let sum = 0;
  for (const c in freq) {
    sum += freq[c] * (freq[c] - 1);
  }
  return sum / (n * (n - 1));
};

const kasiski = (text: string): string => {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  const distances: number[] = [];
  const minLen = 3;
  for (let i = 0; i < cleaned.length - minLen; i++) {
    for (let len = minLen; len <= Math.min(5, cleaned.length - i); len++) {
      const seq = cleaned.slice(i, i + len);
      const next = cleaned.indexOf(seq, i + len);
      if (next !== -1) {
        distances.push(next - i);
      }
    }
  }
  if (distances.length === 0) return '未找到重复序列';
  const gcdAll = distances.reduce((acc, d) => bigGcd(acc, d), distances[0]);
  const candidates: { len: number; count: number }[] = [];
  for (let k = 2; k <= 20; k++) {
    const count = distances.filter((d) => d % k === 0).length;
    candidates.push({ len: k, count });
  }
  candidates.sort((a, b) => b.count - a.count);
  const lines: string[] = [
    '=== Kasiski 检验 ===',
    `找到 ${distances.length} 个重复序列距离`,
    `距离: ${distances.slice(0, 20).join(', ')}${distances.length > 20 ? '...' : ''}`,
    `所有距离的 GCD = ${gcdAll}`,
    '',
    '可能的密钥长度 (按可能性排序):',
  ];
  candidates.slice(0, 10).forEach((c) => {
    lines.push(`  长度 ${c.len}: ${c.count} 个距离整除 (${Math.round(c.count / distances.length * 100)}%)`);
  });
  return lines.join('\n');
};

const vigenereKeylen = (text: string): string => {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  const lines: string[] = ['=== 维吉尼亚密钥长度分析 (IC法) ===', ''];
  const results: { len: number; avgIC: number }[] = [];
  for (let klen = 1; klen <= 20; klen++) {
    const groups: string[] = [];
    for (let i = 0; i < klen; i++) {
      let group = '';
      for (let j = i; j < cleaned.length; j += klen) {
        group += cleaned[j];
      }
      groups.push(group);
    }
    const avgIC = groups.reduce((acc, g) => acc + computeIC(g), 0) / klen;
    results.push({ len: klen, avgIC });
    const marker = avgIC > 0.06 ? ' <<<' : '';
    lines.push(`  长度 ${klen.toString().padStart(2)}: IC = ${avgIC.toFixed(4)}${marker}`);
  }
  const best = [...results].sort((a, b) => b.avgIC - a.avgIC)[0];
  lines.push('');
  lines.push(`最可能的密钥长度: ${best.len} (IC = ${best.avgIC.toFixed(4)})`);
  lines.push('(英语 IC ≈ 0.0667, 随机文本 IC ≈ 0.0385)');
  return lines.join('\n');
};

const freqAnalysis = (text: string): string => {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  const freq: Record<string, number> = {};
  for (const c of cleaned) {
    freq[c] = (freq[c] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const total = cleaned.length;
  const lines: string[] = ['=== 频率分析 ===', ''];
  lines.push('密文频率 vs 英语频率 (降序):');
  lines.push('');
  const engSorted = Object.entries(ENG_FREQ).sort((a, b) => b[1] - a[1]);
  const mapping: Record<string, string> = {};
  for (let i = 0; i < Math.min(sorted.length, engSorted.length); i++) {
    const cipherChar = sorted[i][0];
    const plainChar = engSorted[i][0];
    mapping[cipherChar] = plainChar;
  }
  lines.push('  密文 | 频率% | → 明文 | 英语频率%');
  lines.push('  -----|------|--------|----------');
  for (const [char, count] of sorted) {
    const pct = (count / total * 100).toFixed(2);
    const engPct = ENG_FREQ[char]?.toFixed(3) || '0.000';
    const mapped = mapping[char] || '?';
    lines.push(`  ${char}    | ${pct.padStart(5)} | → ${mapped}     | ${engPct}`);
  }
  lines.push('');
  let decrypted = '';
  for (const c of cleaned) {
    decrypted += mapping[c] || c;
  }
  lines.push('可能的明文 (基于频率映射):');
  lines.push(decrypted);
  return lines.join('\n');
};

const cribDrag = (text: string): string => {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) throw new Error('需要两行: 第一行密文(hex), 第二行crib');
  const cipherHex = lines[0];
  const crib = lines[1];
  const cipherBytes: number[] = [];
  for (let i = 0; i < cipherHex.length; i += 2) {
    cipherBytes.push(parseInt(cipherHex.slice(i, i + 2), 16));
  }
  const cribBytes = strToBytes(crib);
  const results: string[] = ['=== Crib Dragging (已知明文攻击) ===', ''];
  for (let pos = 0; pos <= cipherBytes.length - cribBytes.length; pos++) {
    const key: number[] = [];
    for (let i = 0; i < cribBytes.length; i++) {
      key.push(cipherBytes[pos + i] ^ cribBytes[i]);
    }
    const keyHex = key.map((k) => k.toString(16).padStart(2, '0')).join('');
    const decrypted: number[] = [];
    for (let i = 0; i < key.length; i++) {
      decrypted.push(cipherBytes[i] ^ key[i % key.length]);
    }
    const decStr = decrypted.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    results.push(`位置 ${pos.toString().padStart(3)}: key=${keyHex}`);
    results.push(`           解密: ${decStr}`);
    results.push('');
  }
  return results.join('\n');
};

const strToBytes = (str: string): number[] => {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes);
};

const execute = (input: string, mode: string): string => {
  switch (mode) {
    case 'ic': {
      const ic = computeIC(input);
      return [
        '=== 重合指数 (Index of Coincidence) ===',
        `IC = ${ic.toFixed(6)}`,
        '',
        `英语 IC ≈ 0.0667`,
        `随机 IC ≈ 0.0385`,
        '',
        ic > 0.06 ? '→ 可能是单表替换或明文' : '→ 可能是多表替换 (如维吉尼亚)',
      ].join('\n');
    }
    case 'kasiski':
      return kasiski(input);
    case 'vigenere-keylen':
      return vigenereKeylen(input);
    case 'freq-analysis':
      return freqAnalysis(input);
    case 'crib-drag':
      return cribDrag(input);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="古典密码自动攻击"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'ic')
    }
    modeOptions={[
      { value: 'ic', label: '重合指数' },
      { value: 'kasiski', label: 'Kasiski检验' },
      { value: 'vigenere-keylen', label: '维吉尼亚密钥长度' },
      { value: 'freq-analysis', label: '频率分析' },
      { value: 'crib-drag', label: '已知明文攻击' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'ic', options: [
        { value: 'ic', label: '重合指数' },
        { value: 'kasiski', label: 'Kasiski检验' },
        { value: 'vigenere-keylen', label: '维吉尼亚密钥长度' },
        { value: 'freq-analysis', label: '频率分析' },
        { value: 'crib-drag', label: '已知明文攻击' },
      ] },
    ]}
  />
);

export default ToolComponent;
