import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      {
        name: 'key',
        label: '密钥',
        type: 'text',
        placeholder: 'key',
        default: 'key',
      },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) ?? 'key';
      if (!key) throw new Error('密钥不能为空');
      const keyBytes = new TextEncoder().encode(key);

      if (mode === 'decrypt') {
        // hex string → bytes → XOR → UTF-8 text
        const hexStr = input.replace(/[\s]/g, '');
        const inputBytes = new Uint8Array(hexStr.length / 2);
        for (let i = 0; i < inputBytes.length; i++) {
          inputBytes[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
        }
        const result = new Uint8Array(inputBytes.length);
        for (let i = 0; i < inputBytes.length; i++) {
          result[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        return new TextDecoder().decode(result);
      }

      // encrypt: UTF-8 → XOR → hex output
      const inputBytes = new TextEncoder().encode(input);
      const result = new Uint8Array(inputBytes.length);
      for (let i = 0; i < inputBytes.length; i++) {
        result[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return Array.from(result, (b: number) => b.toString(16).padStart(2, '0')).join('');
    }}
  />
);
export default ToolComponent;
