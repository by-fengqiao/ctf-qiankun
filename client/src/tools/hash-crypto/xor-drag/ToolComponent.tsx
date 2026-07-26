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
        name: 'crib',
        label: 'Crib',
        type: 'text',
        placeholder: 'the',
        default: 'the',
      },
      {
        name: 'position',
        label: '位置',
        type: 'text',
        placeholder: '0',
        default: '0',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const crib = (params.crib as string) ?? 'the';
      const pos = parseInt((params.position as string) ?? '0', 10);
      const dataBytes = hexToBytes(input);
      const cribBytes = new TextEncoder().encode(crib);
      if (pos < 0 || pos + cribBytes.length > dataBytes.length) {
        throw new Error('位置超出范围');
      }
      const result = new Uint8Array(cribBytes.length);
      for (let i = 0; i < cribBytes.length; i++) {
        result[i] = dataBytes[pos + i] ^ cribBytes[i];
      }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(result);
      const hex = Array.from(result, (b: number) => b.toString(16).padStart(2, '0')).join('');
      return `XOR结果(ASCII): ${text}\nXOR结果(Hex): ${hex}`;
    }}
  />
);
export default ToolComponent;
