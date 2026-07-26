import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const base64ToBytes = (b64: string): Uint8Array => {
  const decoded = atob(b64);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
};

const readString = (bytes: Uint8Array, offset: number): { data: Uint8Array; next: number } => {
  if (offset + 4 > bytes.length) throw new Error('数据长度不足');
  const len = (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
  const start = offset + 4;
  if (start + len > bytes.length) throw new Error('数据超出范围');
  return { data: bytes.slice(start, start + len), next: start + len };
};

const bytesToBigInt = (bytes: Uint8Array): string => {
  let hex = Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
  if (!hex) return '0';
  return BigInt('0x' + hex).toString();
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const line = input.trim();
      if (!line) return '请输入SSH公钥';
      const parts = line.split(/\s+/);
      if (parts.length < 2) throw new Error('格式应为: <type> <base64> [comment]');
      const keyType = parts[0];
      const base64Data = parts[1];
      const comment = parts.length > 2 ? parts.slice(2).join(' ') : '';
      const lines = [
        '=== SSH Public Key ===',
        `Type: ${keyType}`,
        `Comment: ${comment || '(none)'}`,
        `Base64 length: ${base64Data.length}`,
      ];
      try {
        const bytes = base64ToBytes(base64Data);
        const wordArray = CryptoJS.lib.WordArray.create(bytes as unknown as number[]);
        lines.push(`Decoded bytes: ${bytes.length}`);
        lines.push(`SHA256 fingerprint: ${CryptoJS.SHA256(wordArray).toString()}`);
        lines.push(`MD5 fingerprint: ${CryptoJS.MD5(wordArray).toString()}`);
        lines.push('', '=== Key Components ===');
        let offset = 0;
        const { data: typeBytes, next: n1 } = readString(bytes, offset);
        const decodedType = new TextDecoder().decode(typeBytes);
        lines.push(`key-type field: ${decodedType}`);
        offset = n1;
        if (keyType === 'ssh-rsa') {
          const { data: eBytes, next: n2 } = readString(bytes, offset);
          lines.push(`e (exponent): ${bytesToBigInt(eBytes)}`);
          offset = n2;
          const { data: nBytes, next: n3 } = readString(bytes, offset);
          lines.push(`n (modulus): ${bytesToBigInt(nBytes)} (${nBytes.length * 8} bits)`);
          offset = n3;
        } else if (keyType === 'ssh-ed25519') {
          const { data: pubBytes, next: n2 } = readString(bytes, offset);
          lines.push(`public key: ${Array.from(pubBytes, (b: number) => b.toString(16).padStart(2, '0')).join('')}`);
          offset = n2;
        } else if (keyType === 'ecdsa-sha2-nistp256' || keyType.startsWith('ecdsa-sha2-')) {
          const { data: curveBytes, next: n2 } = readString(bytes, offset);
          lines.push(`curve: ${new TextDecoder().decode(curveBytes)}`);
          offset = n2;
          const { data: pointBytes, next: n3 } = readString(bytes, offset);
          lines.push(`point: ${Array.from(pointBytes, (b: number) => b.toString(16).padStart(2, '0')).join('')}`);
          offset = n3;
        }
        if (offset < bytes.length) {
          lines.push(`(剩余 ${bytes.length - offset} 字节未解析)`);
        }
      } catch (e) {
        lines.push(`解析错误: ${e instanceof Error ? e.message : '未知错误'}`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
