import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const base64UrlDecode = (str: string): string => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  const decoded = atob(s);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const token = input.trim();
      if (!token) return '请输入JWT';
      const parts = token.split('.');
      if (parts.length < 2) throw new Error('无效的JWT格式，需要至少2个部分');
      let header: string;
      let payload: string;
      try {
        header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
      } catch {
        header = base64UrlDecode(parts[0]);
      }
      try {
        payload = JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2);
      } catch {
        payload = base64UrlDecode(parts[1]);
      }
      const lines = [
        '=== JWT Header ===',
        header,
        '',
        '=== JWT Payload ===',
        payload,
        '',
        `=== Signature (${parts.length > 2 ? parts[2].length : 0} chars) ===`,
        parts[2] ?? '(无签名)',
      ];
      const payloadObj = JSON.parse(base64UrlDecode(parts[1]));
      if (payloadObj && typeof payloadObj === 'object') {
        if (payloadObj.exp) {
          lines.push('', `=== 过期时间 ===`, new Date(payloadObj.exp * 1000).toISOString());
        }
        if (payloadObj.iat) {
          lines.push(`签发时间: ${new Date(payloadObj.iat * 1000).toISOString()}`);
        }
        if (payloadObj.nbf) {
          lines.push(`生效时间: ${new Date(payloadObj.nbf * 1000).toISOString()}`);
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
