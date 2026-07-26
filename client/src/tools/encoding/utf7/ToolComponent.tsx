import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const DIRECT = new Set<string>();
const directChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\'(),-./:?';
for (const c of directChars) DIRECT.add(c);

const strToUtf16BE = (str: string): Uint8Array => {
  const bytes: number[] = [];
  for (const ch of Array.from(str)) {
    const code = ch.charCodeAt(0);
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  return new Uint8Array(bytes);
};

const toModifiedB64 = (bytes: Uint8Array): string => {
  let bits = 0;
  let val = 0;
  let result = '';
  for (const byte of bytes) {
    val = (val << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      result += B64[(val >> (bits - 6)) & 0x3f];
      bits -= 6;
    }
  }
  if (bits > 0) {
    result += B64[(val << (6 - bits)) & 0x3f];
  }
  return result;
};

const fromModifiedB64 = (str: string): Uint8Array => {
  const bytes: number[] = [];
  let bits = 0;
  let val = 0;
  for (const c of str) {
    const idx = B64.indexOf(c);
    if (idx < 0) continue;
    val = (val << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bytes.push((val >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
};

const utf16BEToStr = (bytes: Uint8Array): string => {
  let result = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  }
  return result;
};

const encode = (input: string): string => {
  let result = '';
  let buf = '';
  for (const ch of Array.from(input)) {
    if (DIRECT.has(ch) || ch === '\r' || ch === '\n' || ch === '\t') {
      if (buf) {
        result += `+${toModifiedB64(strToUtf16BE(buf))}-`;
        buf = '';
      }
      result += ch;
    } else {
      buf += ch;
    }
  }
  if (buf) {
    result += `+${toModifiedB64(strToUtf16BE(buf))}-`;
  }
  return result;
};

const decode = (input: string): string => {
  let result = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] === '+') {
      const end = input.indexOf('-', i + 1);
      if (end < 0) {
        const b64Part = input.slice(i + 1);
        if (b64Part) {
          result += utf16BEToStr(fromModifiedB64(b64Part));
        } else {
          result += '+';
        }
        break;
      }
      const b64Part = input.slice(i + 1, end);
      if (b64Part === '') {
        result += '+';
      } else {
        result += utf16BEToStr(fromModifiedB64(b64Part));
      }
      i = end + 1;
    } else {
      result += input[i];
      i++;
    }
  }
  return result;
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
