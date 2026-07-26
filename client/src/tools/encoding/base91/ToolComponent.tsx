import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  let result = '';
  let b = 0;
  let n = 0;
  for (const byte of bytes) {
    b |= byte << n;
    n += 8;
    if (n > 13) {
      let v = b & 8191;
      if (v > 88) {
        b >>= 13;
        n -= 13;
      } else {
        v = b & 16383;
        b >>= 14;
        n -= 14;
      }
      result += ALPHABET[v % 91] + ALPHABET[Math.floor(v / 91)];
    }
  }
  if (n > 0) {
    result += ALPHABET[b % 91];
    if (n > 7 || b > 90) {
      result += ALPHABET[Math.floor(b / 91)];
    }
  }
  return result;
};

const decode = (input: string): string => {
  const clean = input.replace(/\s/g, '');
  const dec: number[] = [];
  const lookup = new Map<string, number>();
  for (let i = 0; i < ALPHABET.length; i++) {
    lookup.set(ALPHABET[i], i);
  }
  let b = 0;
  let n = 0;
  let v = -1;
  for (const c of clean) {
    const val = lookup.get(c);
    if (val === undefined) continue;
    if (v === -1) {
      v = val;
    } else {
      v += val * 91;
      b |= v << n;
      n += v & 8191 ? 13 : 14;
      do {
        dec.push(b & 0xff);
        b >>= 8;
        n -= 8;
      } while (n > 7);
      v = -1;
    }
  }
  if (v !== -1) {
    dec.push((b | (v << n)) & 0xff);
  }
  return bytesToStr(new Uint8Array(dec));
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
