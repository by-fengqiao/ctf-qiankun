import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s+/g, '').replace(/0x/gi, '');
  if (clean.length % 2 !== 0) throw new Error('十六进制长度必须为偶数');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const byte = parseInt(clean.substring(i, i + 2), 16);
  if (isNaN(byte)) throw new Error(`无效的十六进制字符: ${clean.substring(i, i + 2)}`);
    bytes[i / 2] = byte;
  }
  return bytes;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'key',
        label: '密钥(Hex)',
        type: 'text',
        placeholder: 'cafe',
        default: 'cafe',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const keyHex = (params.key as string) ?? 'cafe';
      const dataBytes = hexToBytes(input);
      const keyBytes = hexToBytes(keyHex);
      const result = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        result[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return Array.from(result, (b: number) => b.toString(16).padStart(2, '0')).join('');
    }}
  />
);
export default ToolComponent;
