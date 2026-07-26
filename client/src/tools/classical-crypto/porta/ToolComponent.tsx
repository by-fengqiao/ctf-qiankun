import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Porta cipher: 13 pairs of alphabets, keyed by letter pairs
// Each key letter pair (AB, CD, EF, ...) defines a substitution row
const buildPortaRow = (keyLetter: string): string => {
  const upper = keyLetter.toUpperCase();
  const pairIdx = Math.floor((upper.charCodeAt(0) - 65) / 2);
  // Porta: each pair swaps the latter half of alphabet
  const first = 'ABCDEFGHIJKLM';
  let second = '';
  for (let i = 0; i < 13; i++) {
    second += String.fromCharCode(65 + 13 + ((pairIdx + i) % 13));
  }
  return first + second;
};

const process = (input: string, key: string, decrypt: boolean): string => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (cleanKey.length === 0) return input;
  let result = '';
  let keyIdx = 0;
  for (const ch of input) {
    const upper = ch.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const table = buildPortaRow(cleanKey[keyIdx % cleanKey.length]);
      let out: string;
      if (upper >= 'A' && upper <= 'M') {
        // First half -> second half
        const idx = upper.charCodeAt(0) - 65;
        out = table[idx + 13];
      } else {
        // Second half -> first half (find in second half)
        const target = upper;
        const idx = table.slice(13).indexOf(target);
        out = idx >= 0 ? table[idx] : upper;
      }
      const base = ch <= 'Z' ? 65 : 97;
      result += out ? String.fromCharCode(out.charCodeAt(0) + (base === 97 ? 32 : 0)) : ch;
      keyIdx++;
    } else {
      result += ch;
    }
  }
  return result;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'KEY';
      // Porta is its own inverse for encrypt/decrypt
      return process(input, key, mode === 'decrypt');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥', type: 'text', placeholder: 'KEY', default: 'KEY' },
    ]}
  />
);

export default ToolComponent;
