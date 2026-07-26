import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const base64UrlDecode = (str: string): string => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return atob(s);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const pem = input.trim();
      if (!pem) return '请输入RSA公钥';
      const isPublic = /-----BEGIN (PUBLIC KEY|RSA PUBLIC KEY)-----/.test(pem);
      if (!isPublic) throw new Error('未检测到RSA公钥PEM标记');
      const type = pem.match(/-----BEGIN ([^-]+)-----/)?.[1].trim() ?? 'UNKNOWN';
      const base64Content = pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/\s+/g, '');
      const lines = [
        '=== RSA Public Key Info ===',
        `PEM Type: ${type}`,
        `Base64 length: ${base64Content.length}`,
      ];
      try {
        const decoded = atob(base64Content);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        const wordArray = CryptoJS.lib.WordArray.create(bytes as unknown as number[]);
        lines.push(`Decoded bytes (DER): ${decoded.length}`);
        lines.push(`SHA256: ${CryptoJS.SHA256(wordArray).toString()}`);
        lines.push(`MD5: ${CryptoJS.MD5(wordArray).toString()}`);
        lines.push('', '=== Hex Dump (first 128 bytes) ===');
        const hexLimit = Math.min(bytes.length, 128);
        const hexLines: string[] = [];
        for (let i = 0; i < hexLimit; i += 16) {
          const chunk = bytes.slice(i, Math.min(i + 16, hexLimit));
          const hex = Array.from(chunk, (b: number) => b.toString(16).padStart(2, '0')).join(' ');
          const ascii = Array.from(chunk, (b: number) => (b >= 0x20 && b <= 0x7e) ? String.fromCharCode(b) : '.').join('');
          hexLines.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(48)}  ${ascii}`);
        }
        lines.push(...hexLines);
        lines.push('', '提示: 完整解析RSA n和e需要ASN.1 DER解码器');
      } catch {
        lines.push('DER解码失败');
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
