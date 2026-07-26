import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Decode = (b32: string): Uint8Array => {
  const clean = b32.replace(/\s+/g, '').replace(/=/g, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`无效的Base32字符: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');

const computeHotp = (secret: Uint8Array, counter: number): string => {
  const counterBytes = new Uint8Array(8);
  let v = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  const keyWA = CryptoJS.enc.Hex.parse(bytesToHex(secret));
  const msgWA = CryptoJS.enc.Hex.parse(bytesToHex(counterBytes));
  const hmacHex = CryptoJS.HmacSHA1(msgWA, keyWA).toString();
  const offset = parseInt(hmacHex.slice(-2), 16) & 0x0f;
  const part = hmacHex.slice(offset * 2, offset * 2 + 8);
  const code = (parseInt(part, 16) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'secret',
        label: '密钥(Base32)',
        type: 'text',
        placeholder: 'JBSWY3DPEHPK3PXP',
        default: 'JBSWY3DPEHPK3PXP',
      },
      { name: 'counter', label: '计数器', type: 'text', placeholder: '0', default: '0' },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const secretStr = (params.secret as string) ?? 'JBSWY3DPEHPK3PXP';
      const counter = Math.max(0, parseInt((params.counter as string) ?? '0', 10) || 0);
      const secret = base32Decode(secretStr);
      const code = computeHotp(secret, counter);
      return [
        '=== HOTP (RFC 4226, SHA-1) ===',
        `验证码: ${code}`,
        `计数器: ${counter}`,
        `密钥(Base32): ${secretStr}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
