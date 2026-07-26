import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const process = (input: string, key: string, decrypt: boolean): string => {
  const digits = key.replace(/[^0-9]/g, '').split('').map((d: string) => parseInt(d, 10));
  if (digits.length === 0) return input;
  let result = '';
  let keyIdx = 0;
  for (const ch of input) {
    const upper = ch.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const base = ch <= 'Z' ? 65 : 97;
      const p = upper.charCodeAt(0) - 65;
      const k = digits[keyIdx % digits.length] ?? 0;
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
      const key = (params.key as string) || '12345';
      return process(input, key, mode === 'decrypt');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥(数字)', type: 'text', placeholder: '12345', default: '12345' },
    ]}
  />
);

export default ToolComponent;
