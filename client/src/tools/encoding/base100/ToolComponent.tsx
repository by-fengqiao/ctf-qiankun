import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const OFFSET = 0x1f600;

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  return Array.from(bytes, (b: number) => String.fromCodePoint(OFFSET + b)).join('');
};

const decode = (input: string): string => {
  const bytes: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp >= OFFSET && cp < OFFSET + 256) {
      bytes.push(cp - OFFSET);
    }
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
