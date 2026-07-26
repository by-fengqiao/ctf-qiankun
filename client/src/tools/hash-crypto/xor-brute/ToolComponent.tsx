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

const isPrintable = (byte: number): boolean =>
  (byte >= 0x20 && byte <= 0x7e) || byte === 0x0a || byte === 0x0d || byte === 0x09;

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const dataBytes = hexToBytes(input);
      const results: string[] = [];
      for (let key = 0; key <= 255; key++) {
        const decoded = new Uint8Array(dataBytes.length);
        let allPrintable = true;
        for (let i = 0; i < dataBytes.length; i++) {
          decoded[i] = dataBytes[i] ^ key;
          if (!isPrintable(decoded[i])) {
            allPrintable = false;
            break;
          }
        }
        if (allPrintable) {
          const text = new TextDecoder().decode(decoded);
          results.push(`0x${key.toString(16).padStart(2, '0')}: ${text}`);
        }
      }
      return results.length > 0
        ? results.join('\n')
        : '无可打印结果';
    }}
  />
);
export default ToolComponent;
