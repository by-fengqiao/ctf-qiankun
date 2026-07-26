import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const process = (input: string, key: string, decrypt: boolean): string => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (cleanKey.length === 0) return input;
  let result = '';
  let keyIdx = 0;
  for (const ch of input) {
    const upper = ch.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const base = ch <= 'Z' ? 65 : 97;
      const p = upper.charCodeAt(0) - 65;
      const k = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
      const shift = decrypt ? (26 - k) % 26 : k;
      result += String.fromCharCode(((p + shift) % 26) + base);
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
