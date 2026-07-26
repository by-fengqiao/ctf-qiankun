import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const pem = input.trim();
      if (!pem) return '请输入PEM内容';
      const beginMatch = pem.match(/-----BEGIN ([^-]+)-----/);
      const endMatch = pem.match(/-----END ([^-]+)-----/);
      if (!beginMatch) throw new Error('未找到PEM起始标记');
      const type = beginMatch[1].trim();
      const lines = [
        '=== PEM Info ===',
        `Type: ${type}`,
        `End marker: ${endMatch ? endMatch[1].trim() : 'NOT FOUND'}`,
      ];
      const base64Content = pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/\s+/g, '');
      if (base64Content) {
        lines.push(`Base64 length: ${base64Content.length}`);
        try {
          const decoded = atob(base64Content);
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
          const wordArray = CryptoJS.lib.WordArray.create(bytes as unknown as number[]);
          lines.push(`Decoded bytes: ${decoded.length}`);
          lines.push(`MD5: ${CryptoJS.MD5(wordArray).toString()}`);
          lines.push(`SHA1: ${CryptoJS.SHA1(wordArray).toString()}`);
          lines.push(`SHA256: ${CryptoJS.SHA256(wordArray).toString()}`);
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
        } catch {
          lines.push('解码失败');
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
