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
      if (parts.length < 2) throw new Error('无效的JWT格式');
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(base64UrlDecode(parts[1]));
      } catch {
        throw new Error('Payload 解析失败');
      }
      const now = Math.floor(Date.now() / 1000);
      const details: string[] = [];
      let status = '✅ 有效（未过期）';
      if (payload.iat !== undefined) {
        const iat = Number(payload.iat);
        if (!isNaN(iat)) details.push(`签发时间 (iat): ${new Date(iat * 1000).toISOString()}`);
      }
      if (payload.nbf !== undefined) {
        const nbf = Number(payload.nbf);
        if (!isNaN(nbf)) {
          details.push(`生效时间 (nbf): ${new Date(nbf * 1000).toISOString()}`);
          if (now < nbf) status = '⏳ 尚未生效';
        }
      }
      if (payload.exp !== undefined) {
        const exp = Number(payload.exp);
        if (!isNaN(exp)) {
          details.push(`过期时间 (exp): ${new Date(exp * 1000).toISOString()}`);
          if (now >= exp) {
            status = '🔴 已过期';
            details.push(`已过期: ${now - exp} 秒`);
          } else {
            details.push(`剩余: ${exp - now} 秒`);
          }
        }
      } else {
        details.push('⚠ 未设置 exp 字段（永不过期）');
      }
      return [
        status,
        '',
        ...details,
        '',
        '=== Payload ===',
        JSON.stringify(payload, null, 2),
        '',
        '⚠ 注意: 仅检查时间声明 (exp/nbf)，未验证签名真实性。',
      ].join('\n');
    }}
  />
);
export default ToolComponent;
