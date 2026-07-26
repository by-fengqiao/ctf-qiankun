import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const getFullKey = (prereq: string, plaintext: string): string => {
  // Key = primer + plaintext
  return (prereq + plaintext).toUpperCase().replace(/[^A-Z]/g, '');
};

const encrypt = (input: string, primer: string): string => {
  const cleanPrimer = primer.toUpperCase().replace(/[^A-Z]/g, '');
  // Build full key from primer + plaintext letters only
  const plainLetters = input.toUpperCase().replace(/[^A-Z]/g, '');
  const fullKey = (cleanPrimer + plainLetters);
  let result = '';
  let keyIdx = 0;
  for (const ch of input) {
    const upper = ch.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const base = ch <= 'Z' ? 65 : 97;
      const p = upper.charCodeAt(0) - 65;
      const k = fullKey.charCodeAt(keyIdx) - 65;
      result += String.fromCharCode(((p + k) % 26) + base);
      keyIdx++;
    } else {
      result += ch;
    }
  }
  return result;
};

const decrypt = (input: string, primer: string): string => {
  const cleanPrimer = primer.toUpperCase().replace(/[^A-Z]/g, '');
  let result = '';
  let keyIdx = 0;
  const plainLetters: number[] = [];
  for (const ch of input) {
    const upper = ch.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const base = ch <= 'Z' ? 65 : 97;
      const c = upper.charCodeAt(0) - 65;
      // Key char comes from primer or already-decrypted plaintext
      const k = keyIdx < cleanPrimer.length
        ? cleanPrimer.charCodeAt(keyIdx) - 65
        : (plainLetters[keyIdx - cleanPrimer.length] ?? 0);
      const p = (c - k + 26) % 26;
      plainLetters.push(p);
      result += String.fromCharCode(p + base);
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
      return mode === 'decrypt' ? decrypt(input, key) : encrypt(input, key);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥前缀', type: 'text', placeholder: 'KEY', default: 'KEY' },
    ]}
  />
);

export default ToolComponent;
