import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  if (bytes.length === 0) return '';
  const odd = bytes.length % 2;
  let result = odd ? '1' : '0';
  for (let i = 0; i < bytes.length; i += 2) {
    const hi = bytes[i];
    const lo = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const code = (hi << 8) | lo;
    result += String.fromCharCode(0x4e00 + code);
  }
  return result;
};

const decode = (input: string): string => {
  if (input.length === 0) return '';
  const odd = input[0] === '1';
  const body = input.slice(1);
  const bytes: number[] = [];
  for (const ch of Array.from(body)) {
    const code = ch.charCodeAt(0) - 0x4e00;
    if (code < 0 || code > 0xffff) {
      bytes.push(0x3f);
      continue;
    }
    bytes.push((code >> 8) & 0xff);
    bytes.push(code & 0xff);
  }
  if (odd && bytes.length > 0) {
    bytes.pop();
  }
  return bytesToStr(new Uint8Array(bytes));
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        return mode === 'encode' ? encode(input) : decode(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
