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
        label: '密钥(0xHH)',
        type: 'text',
        placeholder: '0x41',
        default: '0x41',
      },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const keyStr = (params.key as string) ?? '0x41';
      let keyByte = parseInt(keyStr, 16);
      if (isNaN(keyByte)) {
        if (keyStr.length > 0) {
          keyByte = keyStr.charCodeAt(0);
        } else {
          keyByte = 0;
        }
      }
      keyByte = keyByte & 0xff;

      if (mode === 'decrypt') {
        // hex string → bytes → XOR → UTF-8 text
        const hexStr = input.replace(/[\s]/g, '');
        const bytes = new Uint8Array(hexStr.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
        }
        const result = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          result[i] = bytes[i] ^ keyByte;
        }
        return new TextDecoder().decode(result);
      }

      // encrypt: UTF-8 → XOR → hex output
      const bytes = new TextEncoder().encode(input);
      const result = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        result[i] = bytes[i] ^ keyByte;
      }
      return Array.from(result, (b: number) => b.toString(16).padStart(2, '0')).join('');
    }}
  />
);
export default ToolComponent;
