import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      const spaceIdx = trimmed.indexOf(' ');
      if (spaceIdx === -1) {
        throw new Error('Authorization 头格式应为 "Scheme credentials"');
      }
      const scheme = trimmed.slice(0, spaceIdx);
      const credentials = trimmed.slice(spaceIdx + 1).trim();
      const lowerScheme = scheme.toLowerCase();
      const lines: string[] = [];
      lines.push(`Scheme: ${scheme}`);
      lines.push(`Credentials: ${credentials}`);
      lines.push(`Credentials 长度: ${credentials.length}`);
      lines.push('');
      switch (lowerScheme) {
        case 'basic': {
          lines.push('=== Basic Auth 解析 ===');
          const decoded = atob(credentials);
          const colonIdx = decoded.indexOf(':');
          if (colonIdx !== -1) {
            lines.push(`用户名: ${decoded.slice(0, colonIdx)}`);
            lines.push(`密码: ${'*'.repeat(decoded.slice(colonIdx + 1).length)}`);
          } else {
            lines.push(`解码: ${decoded}`);
          }
          break;
        }
        case 'bearer': {
          lines.push('=== Bearer Token ===');
          const parts = credentials.split('.');
          lines.push(`JWT: ${parts.length === 3 ? '是' : '否'}`);
          if (parts.length === 3) {
            try {
              lines.push(`Header: ${JSON.stringify(JSON.parse(atob(parts[0])))}`);
            } catch {
              lines.push(`Header: ${parts[0]}`);
            }
          }
          break;
        }
        case 'digest': {
          lines.push('=== Digest Auth ===');
          const params = credentials.split(',').map((s) => s.trim());
          for (const p of params) {
            lines.push(`  ${p}`);
          }
          break;
        }
        default:
          lines.push(`未知 scheme: ${scheme}`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
