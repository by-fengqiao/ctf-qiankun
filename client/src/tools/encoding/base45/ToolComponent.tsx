import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  let result = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const val = bytes[i] * 256 + bytes[i + 1];
      const c = val % 45;
      const b = Math.floor(val / 45) % 45;
      const a = Math.floor(val / 2025);
      result += ALPHABET[c] + ALPHABET[b] + ALPHABET[a];
    } else {
      const val = bytes[i];
      const b = val % 45;
      const a = Math.floor(val / 45);
      result += ALPHABET[b] + ALPHABET[a];
    }
  }
  return result;
};

const decode = (input: string): string => {
  const clean = input.replace(/[\n\r\t]/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    const chunk = clean.slice(i, i + 3);
    const vals = chunk.split('').map((c: string) => {
      const idx = ALPHABET.indexOf(c);
      if (idx === -1) throw new Error(`无效字符: ${c}`);
      return idx;
    });
    if (vals.length === 3) {
      const val = vals[0] + vals[1] * 45 + vals[2] * 2025;
      out.push(val >> 8, val & 0xff);
    } else if (vals.length === 2) {
      const val = vals[0] + vals[1] * 45;
      out.push(val);
    }
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
