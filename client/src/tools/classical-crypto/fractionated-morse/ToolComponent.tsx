import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
};

const buildKeyedAlpha = (key: string): string => {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (ch: string) => {
    if (!seen.has(ch)) {
      seen.add(ch);
      result.push(ch);
    }
  };
  for (const ch of key.toUpperCase().replace(/[^A-Z]/g, '')) add(ch);
  for (let i = 0; i < 26; i++) add(String.fromCharCode(65 + i));
  return result.join('');
};

const MORSE_CHARS = '.-x';
const MORSE_TRIPLET_MAP: Record<string, number> = {};
let morseIdx = 0;
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 3; k++) {
      const triplet = MORSE_CHARS[i] + MORSE_CHARS[j] + MORSE_CHARS[k];
      if (triplet === 'xxx') continue;
      MORSE_TRIPLET_MAP[triplet] = morseIdx++;
    }
  }
}

const encrypt = (input: string, key: string): string => {
  const keyedAlpha = buildKeyedAlpha(key);
  // Convert to Morse with x separators
  const morseParts: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch === ' ') morseParts.push('x');
    else if (MORSE_MAP[ch]) morseParts.push(MORSE_MAP[ch] + 'x');
  }
  let morseStr = morseParts.join('');
  // Pad to multiple of 3
  while (morseStr.length % 3 !== 0) morseStr += 'x';
  // Group into triplets and substitute
  const result: string[] = [];
  for (let i = 0; i < morseStr.length; i += 3) {
    const triplet = morseStr.slice(i, i + 3);
    const idx = MORSE_TRIPLET_MAP[triplet];
    if (idx !== undefined && idx < 26) {
      result.push(keyedAlpha[idx]);
    }
  }
  return result.join('');
};

const decrypt = (input: string, key: string): string => {
  const keyedAlpha = buildKeyedAlpha(key);
  // Reverse triplet map
  const reverseTriplet: string[] = new Array(26).fill('xxx');
  for (const [trip, idx] of Object.entries(MORSE_TRIPLET_MAP)) {
    reverseTriplet[idx] = trip;
  }
  // Substitute letters to triplets
  let morseStr = '';
  for (const ch of input.toUpperCase()) {
    const idx = keyedAlpha.indexOf(ch);
    if (idx >= 0) morseStr += reverseTriplet[idx];
  }
  // Parse Morse back to text
  const result: string[] = [];
  const letters = morseStr.split('x').filter(Boolean);
  const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
    Object.entries(MORSE_MAP).map(([k, v]: [string, string]) => [v, k]),
  );
  for (const code of letters) {
    if (REVERSE_MORSE[code]) result.push(REVERSE_MORSE[code]);
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'KEYWORD';
      return mode === 'decrypt' ? decrypt(input, key) : encrypt(input, key);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥', type: 'text', placeholder: 'KEYWORD', default: 'KEYWORD' },
    ]}
  />
);

export default ToolComponent;
