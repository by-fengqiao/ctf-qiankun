import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);

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
  if (num === 0n) return '0'.repeat(Math.max(leadingZeros, 1));
  let result = '';
  while (num > 0n) {
    const remainder = Number(num % 36n);
    result = (remainder < 10 ? String.fromCharCode(48 + remainder) : String.fromCharCode(55 + remainder)) + result;
    num /= 36n;
  }
  return '0'.repeat(leadingZeros) + result;
};

const decode = (input: string): string => {
  const clean = input.replace(/\s/g, '');
  let leadingZeros = 0;
  for (const c of clean) {
    if (c === '0') leadingZeros++;
    else break;
  }
  let num = 0n;
  for (const c of clean) {
    let val: number;
    if (c >= '0' && c <= '9') val = c.charCodeAt(0) - 48;
    else if (c >= 'A' && c <= 'Z') val = c.charCodeAt(0) - 55;
    else if (c >= 'a' && c <= 'z') val = c.charCodeAt(0) - 87;
    else throw new Error(`无效字符: ${c}`);
    num = num * 36n + BigInt(val);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  for (let i = 0; i < leadingZeros; i++) {
    bytes.unshift(0);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
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
