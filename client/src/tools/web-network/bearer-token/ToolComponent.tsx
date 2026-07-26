import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const cleaned = input.replace(/^Bearer\s+/i, '').trim();
      if (!cleaned) {
        throw new Error('未找到 Bearer token');
      }
      const parts = cleaned.split('.');
      const lines: string[] = [];
      lines.push(`Token 类型: Bearer`);
      lines.push(`Token 长度: ${cleaned.length} 字符`);
      lines.push(`JWT 结构: ${parts.length === 3 ? '是 (3 段)' : `否 (${parts.length} 段)`}`);
      if (parts.length === 3) {
        lines.push('');
        lines.push('=== Header ===');
        try {
          const header = JSON.parse(atob(parts[0]));
          lines.push(JSON.stringify(header, null, 2));
        } catch {
          lines.push(parts[0]);
        }
        lines.push('');
        lines.push('=== Payload ===');
        try {
          const payload = JSON.parse(atob(parts[1]));
          lines.push(JSON.stringify(payload, null, 2));
          const exp = payload.exp;
          if (exp) {
            const expDate = new Date(exp * 1000);
            lines.push(`\n过期时间: ${expDate.toISOString()}`);
          }
          const iat = payload.iat;
          if (iat) {
            const iatDate = new Date(iat * 1000);
            lines.push(`签发时间: ${iatDate.toISOString()}`);
          }
        } catch {
          lines.push(parts[1]);
        }
        lines.push('');
        lines.push(`=== Signature ===`);
        lines.push(parts[2]);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
