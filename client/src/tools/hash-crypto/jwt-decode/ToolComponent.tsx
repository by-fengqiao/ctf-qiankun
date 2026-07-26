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

const prettyJson = (str: string): string => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const token = input.trim();
      if (!token) return '请输入JWT';
      const parts = token.split('.');
      if (parts.length < 2) throw new Error('无效的JWT格式，需要 header.payload.signature');
      return [
        '=== Header ===',
        prettyJson(base64UrlDecode(parts[0])),
        '',
        '=== Payload ===',
        prettyJson(base64UrlDecode(parts[1])),
        '',
        `=== Signature (${parts.length > 2 ? parts[2].length : 0} chars) ===`,
        parts[2] ?? '(无签名)',
      ].join('\n');
    }}
  />
);
export default ToolComponent;
