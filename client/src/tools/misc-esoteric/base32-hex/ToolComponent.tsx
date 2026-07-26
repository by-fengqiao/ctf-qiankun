import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUV';

function encodeBase32Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 0x1f;
      result += ALPHABET[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 0x1f;
    result += ALPHABET[index];
  }

  while (result.length % 8 !== 0) {
    result += '=';
  }

  return result;
}

function decodeBase32Hex(text: string): string {
  const cleaned = text.replace(/=+$/, '').replace(/\s/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i].toUpperCase();
    let index = -1;
    if (ch >= '0' && ch <= '9') index = ch.charCodeAt(0) - '0'.charCodeAt(0);
    else if (ch >= 'A' && ch <= 'V') index = ch.charCodeAt(0) - 'A'.charCodeAt(0) + 10;

    if (index === -1) {
      throw new Error(`无效的 Base32Hex 字符: ${cleaned[i]}`);
    }

    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      const byte = (value >>> (bits - 8)) & 0xff;
      bytes.push(byte);
      bits -= 8;
    }
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeBase32Hex(input);
      return encodeBase32Hex(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
