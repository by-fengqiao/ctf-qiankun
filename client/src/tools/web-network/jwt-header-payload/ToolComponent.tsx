import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const base64urlDecode = (str: string): string => {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const token = input.trim().replace(/^Bearer\s+/i, '');
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('JWT 至少需要 2 段 (header.payload)');
      }
      const lines: string[] = [];
      lines.push(`Token 段数: ${parts.length}`);
      lines.push('');
      lines.push('=== Header ===');
      try {
        const header = JSON.parse(base64urlDecode(parts[0]));
        lines.push(JSON.stringify(header, null, 2));
      } catch {
        lines.push(`(无法解码: ${parts[0]})`);
      }
      lines.push('');
      lines.push('=== Payload ===');
      try {
        const payload = JSON.parse(base64urlDecode(parts[1]));
        lines.push(JSON.stringify(payload, null, 2));
        if (payload.exp) {
          lines.push(`\n过期时间: ${new Date(payload.exp * 1000).toISOString()}`);
        }
        if (payload.iat) {
          lines.push(`签发时间: ${new Date(payload.iat * 1000).toISOString()}`);
        }
        if (payload.nbf) {
          lines.push(`生效时间: ${new Date(payload.nbf * 1000).toISOString()}`);
        }
      } catch {
        lines.push(`(无法解码: ${parts[1]})`);
      }
      if (parts[2]) {
        lines.push('');
        lines.push('=== Signature ===');
        lines.push(parts[2]);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
