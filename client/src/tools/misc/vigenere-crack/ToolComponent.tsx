import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ENG_FREQ = [
  0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,
  0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,
  0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056,
  0.02758, 0.00978, 0.02360, 0.00150, 0.01974, 0.00074,
];

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function vigenereDecrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const shift = key.charCodeAt(i % key.length) - 65;
    const decrypted = ((text.charCodeAt(i) - 65 - shift + 26) % 26) + 65;
    result += String.fromCharCode(decrypted);
  }
  return result;
}

function findKey(text: string, keyLen: number): string {
  let key = '';
  for (let i = 0; i < keyLen; i++) {
    let bestShift = 0;
    let bestScore = -Infinity;
    for (let shift = 0; shift < 26; shift++) {
      let score = 0;
      for (let j = i; j < text.length; j += keyLen) {
        const decrypted = (text.charCodeAt(j) - 65 - shift + 26) % 26;
        score += Math.log(ENG_FREQ[decrypted]);
      }
      if (score > bestScore) {
        bestScore = score;
        bestShift = shift;
      }
    }
    key += String.fromCharCode(65 + bestShift);
  }
  return key;
}

function indexCoincidence(text: string, keyLen: number): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < keyLen; i++) {
    const freq = new Array(26).fill(0);
    let n = 0;
    for (let j = i; j < text.length; j += keyLen) {
      freq[text.charCodeAt(j) - 65]++;
      n++;
    }
    if (n <= 1) continue;
    let ic = 0;
    for (let k = 0; k < 26; k++) {
      ic += freq[k] * (freq[k] - 1);
    }
    ic = ic / (n * (n - 1));
    total += ic;
    count++;
  }
  return count > 0 ? total / count : 0;
}

function kasiskiExamination(text: string): Map<number, number> {
  const distances: number[] = [];
  for (let len = 3; len <= Math.min(8, Math.floor(text.length / 2)); len++) {
    const seen = new Map<string, number>();
    for (let i = 0; i <= text.length - len; i++) {
      const sub = text.substring(i, i + len);
      const prev = seen.get(sub);
      if (prev !== undefined) {
        distances.push(i - prev);
      } else {
        seen.set(sub, i);
      }
    }
  }

  const gcdCounts = new Map<number, number>();
  for (const d of distances) {
    for (let k = 2; k <= 20; k++) {
      if (d % k === 0) {
        gcdCounts.set(k, (gcdCounts.get(k) ?? 0) + 1);
      }
    }
  }
  return gcdCounts;
}

function vigenereCrack(ciphertext: string): string {
  const text = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');

  if (text.length < 10) {
    throw new Error('密文太短，至少需要 10 个字母');
  }

  const kasiski = kasiskiExamination(text);
  const kasiskiCandidates = Array.from(kasiski.entries())
    .sort((a: [number, number], b: [number, number]) => b[1] - a[1])
    .map(([len, score]: [number, number]) => ({ length: len, score }));

  const icResults: { length: number; ic: number }[] = [];
  for (let k = 1; k <= 20; k++) {
    const ic = indexCoincidence(text, k);
    icResults.push({ length: k, ic });
  }

  const topLengths = new Set<number>();
  for (const c of kasiskiCandidates.slice(0, 5)) {
    topLengths.add(c.length);
  }
  for (const r of icResults.sort(
    (a, b) => Math.abs(b.ic - 0.0667) - Math.abs(a.ic - 0.0667),
  ).slice(0, 5)) {
    topLengths.add(r.length);
  }
  if (topLengths.size === 0) {
    for (let k = 1; k <= 5; k++) topLengths.add(k);
  }

  const sortedLengths = Array.from(topLengths).sort(
    (a: number, b: number) => a - b,
  );
  const candidates = sortedLengths.slice(0, 5);

  let output = '=== 维吉尼亚密码破解 ===\n\n';
  output += `密文长度: ${text.length}\n`;
  output += `分析密文: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}\n\n`;

  output += '--- Kasiski 检验 (密钥长度候选) ---\n';
  if (kasiskiCandidates.length > 0) {
    for (const c of kasiskiCandidates.slice(0, 5)) {
      output += `  密钥长度 ${c.length}: 分数 ${c.score}\n`;
    }
  } else {
    output += '  (未发现重复子串)\n';
  }
  output += '\n';

  output += '--- 重合指数 (IC) 分析 ---\n';
  output += '  英语 IC ≈ 0.0667，随机文本 IC ≈ 0.0385\n';
  for (const r of icResults) {
    const marker = Math.abs(r.ic - 0.0667) < 0.005 ? ' ← 可能' : '';
    output += `  长度 ${r.length.toString().padStart(2, ' ')}: IC = ${r.ic.toFixed(4)}${marker}\n`;
  }
  output += '\n';

  output += '--- 最佳破解结果 ---\n\n';
  for (const keyLen of candidates) {
    const key = findKey(text, keyLen);
    const plaintext = vigenereDecrypt(text, key);
    const ic = indexCoincidence(text, keyLen);
    output += `[密钥长度 ${keyLen}] (IC=${ic.toFixed(4)})\n`;
    output += `  密钥:   ${key}\n`;
    output += `  明文:   ${plaintext.substring(0, 80)}${plaintext.length > 80 ? '...' : ''}\n\n`;
  }

  return output.trim();
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="维吉尼亚密码破解"
    execute={(input: string): string => vigenereCrack(input)}
  />
);

export default ToolComponent;
