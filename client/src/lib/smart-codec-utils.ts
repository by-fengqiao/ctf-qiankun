import { CODECS, CODEC_MAP, tryDecode, type Codec, type DecodeCandidate, type EncodeLayer } from './codecs';

const ENGLISH_WORDS = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'];

const VIGENERE_DICT = ['flag', 'key', 'secret', 'password', 'ctf', 'crypto', 'hack', 'admin', 'test', 'abc', 'xyz', 'a', 'password', 'qwerty'];

export interface ExpectedMatch {
  prefix: string;
  suffix: string;
  useRegex: boolean;
}

const DEFAULT_EXPECTED: ExpectedMatch = { prefix: 'flag{', suffix: '}', useRegex: false };

export function loadExpected(): ExpectedMatch {
  try {
    const stored = localStorage.getItem('smart_codec_expected');
    if (stored) return { ...DEFAULT_EXPECTED, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_EXPECTED;
}

export function saveExpected(expected: ExpectedMatch): void {
  try { localStorage.setItem('smart_codec_expected', JSON.stringify(expected)); } catch { /* ignore */ }
}

export function printableRatio(text: string): number {
  if (!text) return 0;
  let printable = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 32 || code === 10 || code === 13 || code === 9) printable++;
  }
  return (printable / text.length) * 100;
}

function hasCJK(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x4e00 && code <= 0x9fff) return true;
    if (code >= 0x3400 && code <= 0x4dbf) return true;
  }
  return false;
}

function hasEnglishWords(text: string): boolean {
  const lower = text.toLowerCase();
  let found = 0;
  for (const word of ENGLISH_WORDS) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) found++;
  }
  return found >= 2;
}

export function scoreResult(result: string, error: boolean, expected?: ExpectedMatch): number {
  if (error || !result) return 0;
  let score = printableRatio(result);
  const trimmed = result.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); score += 20; } catch { /* not JSON */ }
  }
  if (hasEnglishWords(result)) score += 10;
  if (/https?:\/\/|www\./.test(result)) score += 10;
  if (hasCJK(result)) {
    let cjkCount = 0;
    for (const char of result) {
      const code = char.codePointAt(0) ?? 0;
      if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)) cjkCount++;
    }
    if (cjkCount >= 2) score += 15;
  }
  if (expected) {
    let prefixMatched = false, suffixMatched = false;
    if (expected.useRegex) {
      try {
        const re = new RegExp(expected.prefix);
        if (re.test(trimmed)) { score += 30; prefixMatched = true; }
        const re2 = new RegExp(expected.suffix);
        if (re2.test(trimmed)) { score += 30; suffixMatched = true; }
      } catch { /* invalid regex */ }
    } else {
      if (expected.prefix && trimmed.startsWith(expected.prefix)) { score += 30; prefixMatched = true; }
      if (expected.suffix && trimmed.endsWith(expected.suffix)) { score += 30; suffixMatched = true; }
    }
    if (prefixMatched && suffixMatched) score += 50;
  }
  return Math.min(Math.round(score), 100);
}

export function formatDecode(input: string, expected?: ExpectedMatch): DecodeCandidate[] {
  const results: DecodeCandidate[] = [];
  for (const codec of CODECS) {
    if (!codec.test(input)) continue;
    const { result, error } = tryDecode(() => codec.decode(input));
    if (error) continue;
    const confidence = scoreResult(result, false, expected);
    if (confidence === 0) continue;
    results.push({
      type: codec.name, result, confidence,
      description: codec.decodeOnly ? `${codec.name}（仅解码）` : codec.name,
      steps: [`检测到 ${codec.name} 格式`, `执行 ${codec.name} 解码`, '解码完成'],
    });
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

const MAX_CANDIDATES = 20;
const BRUTE_CAESAR_LIMIT = 10000;
const BRUTE_XOR_LIMIT = 4096;
const BRUTE_BASE_LIMIT = 5000;

export function bruteForceDecode(input: string, expected?: ExpectedMatch): DecodeCandidate[] {
  const results: DecodeCandidate[] = [];
  const inputLen = input.length;

  if (inputLen <= BRUTE_CAESAR_LIMIT) {
    for (let shift = 1; shift <= 25; shift++) {
      const { result, error } = tryDecode(() => CODEC_MAP['Caesar'].decode(input, String(shift)));
      if (error) continue;
      const conf = scoreResult(result, false, expected);
      if (conf > 0) results.push({
        type: 'Caesar', result, confidence: conf, description: `Caesar 移位 shift=${shift}`,
        steps: [`暴力遍历 Caesar shift=${shift}`], isBruteForce: true, bruteForceParam: `shift=${shift}`,
      });
    }
    for (const key of VIGENERE_DICT) {
      const { result, error } = tryDecode(() => CODEC_MAP['Vigenère'].decode(input, key));
      if (error) continue;
      const conf = scoreResult(result, false, expected);
      if (conf > 0) results.push({
        type: "Vigenère", result, confidence: conf, description: `Vigenère key=${key}`,
        steps: [`暴力遍历 Vigenère key=${key}`], isBruteForce: true, bruteForceParam: `key=${key}`,
      });
    }
    const atbashResult = tryDecode(() => CODEC_MAP['Atbash'].decode(input));
    if (!atbashResult.error) {
      const conf = scoreResult(atbashResult.result, false, expected);
      if (conf > 0) results.push({
        type: 'Atbash', result: atbashResult.result, confidence: conf, description: 'Atbash 反转密码',
        steps: ['暴力遍历 Atbash'], isBruteForce: true, bruteForceParam: 'atbash',
      });
    }
  }

  if (inputLen <= BRUTE_XOR_LIMIT) {
    for (let key = 0; key < 256; key++) {
      const keyStr = `0x${key.toString(16).padStart(2, '0')}`;
      const { result, error } = tryDecode(() => CODEC_MAP['XOR'].decode(input, String.fromCharCode(key)));
      if (error) continue;
      const conf = scoreResult(result, false, expected);
      if (conf > 30) results.push({
        type: 'XOR', result, confidence: conf, description: `XOR key=${keyStr}`,
        steps: [`暴力遍历 XOR key=${keyStr}`], isBruteForce: true, bruteForceParam: `key=${keyStr}`,
      });
    }
  }

  if (inputLen <= BRUTE_BASE_LIMIT) {
    const baseNames = ['Base32', 'Base36', 'Base45', 'Base58', 'Base62', 'Base85', 'Base92', 'Z85', 'Base2048', 'Base65536'];
    for (const name of baseNames) {
      const codec = CODEC_MAP[name];
      if (!codec || !codec.test(input)) continue;
      const { result, error } = tryDecode(() => codec.decode(input));
      if (error) continue;
      const conf = scoreResult(result, false, expected);
      if (conf > 0) results.push({
        type: name, result, confidence: conf, description: `${name} 盲试`,
        steps: [`暴力遍历 ${name}`], isBruteForce: true,
      });
    }
  }

  const rot47Result = tryDecode(() => CODEC_MAP['ROT47'].decode(input));
  if (!rot47Result.error) {
    const conf = scoreResult(rot47Result.result, false, expected);
    if (conf > 0) results.push({
      type: 'ROT47', result: rot47Result.result, confidence: conf, description: 'ROT47 字符移位',
      steps: ['暴力遍历 ROT47'], isBruteForce: true, bruteForceParam: 'rot47',
    });
  }

  const rot5Result = tryDecode(() => CODEC_MAP['ROT5'].decode(input));
  if (!rot5Result.error) {
    const conf = scoreResult(rot5Result.result, false, expected);
    if (conf > 0) results.push({
      type: 'ROT5', result: rot5Result.result, confidence: conf, description: 'ROT5 数字移位',
      steps: ['暴力遍历 ROT5'], isBruteForce: true, bruteForceParam: 'rot5',
    });
  }

  const revResult = tryDecode(() => CODEC_MAP['Reverse'].decode(input));
  if (!revResult.error) {
    const conf = scoreResult(revResult.result, false, expected);
    if (conf > 0) results.push({
      type: 'Reverse', result: revResult.result, confidence: conf, description: '字符串反转',
      steps: ['暴力遍历 Reverse'], isBruteForce: true, bruteForceParam: 'reverse',
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, MAX_CANDIDATES);
}

export function beamSearchDecode(input: string, expected?: ExpectedMatch, maxDepth: number = 5): DecodeCandidate[] {
  const allResults: DecodeCandidate[] = [];
  const seen = new Set<string>();

  function search(current: string, depth: number, steps: string[], beam: number) {
    if (depth >= maxDepth || allResults.length >= MAX_CANDIDATES) return;
    const layerResults: { codec: Codec; result: string; confidence: number }[] = [];

    for (const codec of CODECS) {
      if (!codec.test(current)) continue;
      const { result, error } = tryDecode(() => codec.decode(current));
      if (error || !result) continue;
      const confidence = scoreResult(result, false, expected);
      if (confidence > 0) layerResults.push({ codec, result, confidence });
    }

    if (depth === 0) {
      const brute = bruteForceDecode(current, expected);
      for (const b of brute) {
        if (!seen.has(b.result)) {
          seen.add(b.result);
          allResults.push({
            ...b, steps: [...steps, b.steps[0] ?? `${b.type} 暴力遍历`],
          });
        }
      }
    }

    layerResults.sort((a, b) => b.confidence - a.confidence);
    const top = layerResults.slice(0, beam);

    for (const { codec, result, confidence } of top) {
      if (seen.has(result)) continue;
      seen.add(result);
      allResults.push({
        type: codec.name, result, confidence,
        description: `递归第${depth + 1}层 ${codec.name}`,
        steps: [...steps, `第${depth + 1}层: ${codec.name} → ${result.slice(0, 60)}${result.length > 60 ? '...' : ''}`],
      });
      search(result, depth + 1, [...steps, `第${depth + 1}层: ${codec.name}`], beam);
    }
  }

  search(input, 0, [`初始输入: ${input.slice(0, 60)}${input.length > 60 ? '...' : ''}`], 3);
  allResults.sort((a, b) => b.confidence - a.confidence);
  return allResults.slice(0, MAX_CANDIDATES);
}

export function smartDecode(input: string, expected?: ExpectedMatch): { candidates: DecodeCandidate[]; usedBruteForce: boolean } {
  if (!input.trim()) return { candidates: [], usedBruteForce: false };

  const matched = formatDecode(input, expected);
  const topConfidence = matched.length > 0 ? matched[0].confidence : 0;

  if (matched.length > 0 && topConfidence >= 50) {
    return { candidates: matched.slice(0, MAX_CANDIDATES), usedBruteForce: false };
  }

  const brute = bruteForceDecode(input, expected);
  const combined = [...matched, ...brute];
  const deduped = combined.filter((c, i, arr) =>
    arr.findIndex((x) => x.result === c.result) === i
  );
  deduped.sort((a, b) => b.confidence - a.confidence);

  return { candidates: deduped.slice(0, MAX_CANDIDATES), usedBruteForce: brute.length > 0 };
}

export function executeEncodeChain(input: string, chain: EncodeLayer[]): {
  output: string;
  previews: { layer: number; codecName: string; param: string; result: string }[];
  error?: string;
} {
  let current = input;
  const previews: { layer: number; codecName: string; param: string; result: string }[] = [];

  for (let i = 0; i < chain.length; i++) {
    const layer = chain[i];
    const codec = CODEC_MAP[layer.codecName];
    if (!codec) { return { output: current, previews, error: `第${i + 1}层: 未知编解码器 ${layer.codecName}` }; }
    if (codec.decodeOnly) { return { output: current, previews, error: `第${i + 1}层: ${layer.codecName} 不支持编码` }; }
    try {
      current = codec.encode(current, layer.param);
      previews.push({ layer: i + 1, codecName: layer.codecName, param: layer.param, result: current.slice(0, 200) });
    } catch (e) {
      return { output: current, previews, error: `第${i + 1}层 ${layer.codecName} 编码失败: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  return { output: current, previews };
}

export function verifyRoundTrip(original: string, encoded: string, chain: EncodeLayer[]): {
  verified: boolean;
  decoded: string;
  failedLayer?: number;
} {
  let current = encoded;
  for (let i = chain.length - 1; i >= 0; i--) {
    const layer = chain[i];
    const codec = CODEC_MAP[layer.codecName];
    if (!codec) return { verified: false, decoded: current, failedLayer: i + 1 };
    try {
      current = codec.decode(current, layer.param);
    } catch {
      return { verified: false, decoded: current, failedLayer: i + 1 };
    }
  }
  return { verified: current === original, decoded: current };
}

export const MAX_INPUT_SIZE = 1024 * 1024;

export function truncateInput(input: string): { text: string; truncated: boolean } {
  if (input.length > MAX_INPUT_SIZE) {
    return { text: input.slice(0, MAX_INPUT_SIZE), truncated: true };
  }
  return { text: input, truncated: false };
}

export const ENCODE_PRESETS: { name: string; description: string; chain: EncodeLayer[] }[] = [
  { name: 'CTF 经典', description: 'XOR → Base64 → Hex', chain: [
    { codecName: 'XOR', param: '0x42' }, { codecName: 'Base64', param: '' }, { codecName: 'Hex', param: '' },
  ]},
  { name: '套娃 Base64', description: 'Base64 × 3', chain: [
    { codecName: 'Base64', param: '' }, { codecName: 'Base64', param: '' }, { codecName: 'Base64', param: '' },
  ]},
  { name: '古典组合', description: 'Caesar → Atbash → Morse', chain: [
    { codecName: 'Caesar', param: '7' }, { codecName: 'Atbash', param: '' }, { codecName: 'Morse', param: '' },
  ]},
  { name: 'Hex + Base64', description: 'Hex → Base64', chain: [
    { codecName: 'Hex', param: '' }, { codecName: 'Base64', param: '' },
  ]},
  { name: 'URL + Base32', description: 'URL → Base32', chain: [
    { codecName: 'URL', param: '' }, { codecName: 'Base32', param: '' },
  ]},
];

export function recommendChain(plaintext: string, unreadability: number): EncodeLayer[] {
  const chain: EncodeLayer[] = [];
  const hasAscii = /[a-zA-Z]/.test(plaintext);
  const hasDigits = /[0-9]/.test(plaintext);

  if (unreadability >= 1) {
    chain.push({ codecName: 'Base64', param: '' });
  }
  if (unreadability >= 2 && hasAscii) {
    chain.push({ codecName: 'Caesar', param: '13' });
  }
  if (unreadability >= 3) {
    chain.push({ codecName: 'Hex', param: '' });
  }
  if (unreadability >= 4) {
    chain.push({ codecName: 'Base64', param: '' });
  }
  if (unreadability >= 5 && hasDigits) {
    chain.push({ codecName: 'ROT5', param: '' });
  }
  if (chain.length === 0) {
    chain.push({ codecName: 'Base64', param: '' });
  }
  return chain.slice(0, 10);
}
