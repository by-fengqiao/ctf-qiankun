import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b === 0) leadingZeros++;
    else break;
  }
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }
  if (num === 0n) return ALPHABET[0].repeat(Math.max(leadingZeros, 1));
  let result = '';
  const base = BigInt(ALPHABET.length);
  while (num > 0n) {
    result = ALPHABET[Number(num % base)] + result;
    num /= base;
  }
  return ALPHABET[0].repeat(leadingZeros) + result;
};

const decode = (input: string): string => {
  const clean = input.replace(/\s/g, '');
  let leadingZeros = 0;
  for (const c of clean) {
    if (c === ALPHABET[0]) leadingZeros++;
    else break;
  }
  let num = 0n;
  const base = BigInt(ALPHABET.length);
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`无效字符: ${c}`);
    num = num * base + BigInt(idx);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  for (let i = 0; i < leadingZeros; i++) {
    bytes.unshift(0);
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
