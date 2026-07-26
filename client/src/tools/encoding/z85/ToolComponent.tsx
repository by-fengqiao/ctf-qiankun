import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  const remainder = bytes.length % 4;
  const paddedBytes = new Uint8Array(bytes.length + (remainder ? 4 - remainder : 0));
  paddedBytes.set(bytes);
  let result = ALPHABET[remainder];
  for (let i = 0; i < paddedBytes.length; i += 4) {
    let val = (paddedBytes[i] << 24) | (paddedBytes[i + 1] << 16) | (paddedBytes[i + 2] << 8) | paddedBytes[i + 3];
    val = val >>> 0;
    const chars: string[] = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(ALPHABET[val % 85]);
      val = Math.floor(val / 85);
    }
    result += chars.join('');
  }
  return result;
};

const decode = (input: string): string => {
  const clean = input.replace(/\s/g, '');
  if (clean.length === 0) return '';
  const remainder = ALPHABET.indexOf(clean[0]);
  if (remainder === -1) throw new Error('无效的长度标记');
  const body = clean.slice(1);
  const out: number[] = [];
  for (let i = 0; i < body.length; i += 5) {
    let val = 0;
    const chunk = body.slice(i, i + 5);
    for (const c of chunk) {
      const idx = ALPHABET.indexOf(c);
      if (idx === -1) throw new Error(`无效字符: ${c}`);
      val = val * 85 + idx;
    }
    out.push((val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
  }
  const trimCount = remainder ? 4 - remainder : 0;
  return bytesToStr(new Uint8Array(out.slice(0, out.length - trimCount)));
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
