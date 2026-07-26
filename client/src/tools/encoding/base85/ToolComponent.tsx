import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  let result = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const remaining = bytes.length - i;
    const chunk = new Uint8Array(4);
    chunk.set(bytes.subarray(i, i + 4));
    let val = (chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3];
    val = val >>> 0;
    const chars: string[] = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(String.fromCharCode(val % 85 + 33));
      val = Math.floor(val / 85);
    }
    result += chars.slice(0, remaining + 1).join('');
  }
  return `<~${result}~>`;
};

const decode = (input: string): string => {
  let clean = input.trim();
  if (clean.startsWith('<~')) clean = clean.slice(2);
  if (clean.endsWith('~>')) clean = clean.slice(0, -2);
  clean = clean.replace(/\s/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 5) {
    const chunk = clean.slice(i, i + 5);
    const chars = chunk.split('');
    while (chars.length < 5) chars.push('u');
    let val = 0;
    for (const c of chars) {
      const code = c.charCodeAt(0) - 33;
      if (code < 0 || code > 84) throw new Error(`无效字符: ${c}`);
      val = val * 85 + code;
    }
    const padding = 5 - chunk.length;
    const bytes = [(val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff];
    out.push(...bytes.slice(0, 4 - padding));
  }
  return bytesToStr(new Uint8Array(out));
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
