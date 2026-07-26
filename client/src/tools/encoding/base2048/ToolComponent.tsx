import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const OFFSET = 0x4e00;
const BITS = 11;

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  if (bytes.length === 0) return '';
  let bits = 0;
  let value = 0n;
  let result = '';
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
    bits += 8;
    while (bits >= BITS) {
      result += String.fromCodePoint(OFFSET + Number((value >> BigInt(bits - BITS)) & 0x7ffn));
      bits -= BITS;
    }
  }
  let paddingBits = 0;
  if (bits > 0) {
    paddingBits = BITS - bits;
    result += String.fromCodePoint(OFFSET + Number((value << BigInt(paddingBits)) & 0x7ffn));
  }
  return String.fromCharCode(48 + paddingBits) + result;
};

const decode = (input: string): string => {
  if (input.length === 0) return '';
  const paddingBits = input.charCodeAt(0) - 48;
  if (paddingBits < 0 || paddingBits > 10) throw new Error('无效的长度标记');
  const body = input.slice(1);
  let bits = 0;
  let value = 0n;
  let numChars = 0;
  const out: number[] = [];
  for (const ch of body) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp >= OFFSET && cp < OFFSET + 2048) {
      value = (value << BigInt(BITS)) | BigInt(cp - OFFSET);
      bits += BITS;
      numChars++;
      while (bits >= 8) {
        out.push(Number((value >> BigInt(bits - 8)) & 0xffn));
        bits -= 8;
      }
    }
  }
  const realBytes = (numChars * BITS - paddingBits) / 8;
  return bytesToStr(new Uint8Array(out.slice(0, realBytes)));
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
