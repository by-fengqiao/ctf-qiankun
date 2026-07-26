import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58n;

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  if (!input) return '';
  const bytes = strToBytes(input);
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }
  let result = '';
  while (num > 0n) {
    result = ALPHABET[Number(num % BASE)] + result;
    num /= BASE;
  }
  for (const b of bytes) {
    if (b === 0) result = '1' + result;
    else break;
  }
  return result || '1';
};

const decode = (input: string): string => {
  const clean = input.replace(/\s/g, '');
  let num = 0n;
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`无效字符: ${c}`);
    num = num * BASE + BigInt(idx);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  let leadingZeros = 0;
  for (const c of clean) {
    if (c === '1') leadingZeros++;
    else break;
  }
  const fullBytes = new Array(leadingZeros).fill(0).concat(bytes);
  return bytesToStr(new Uint8Array(fullBytes));
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
