import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const CORS_EXPLANATIONS: Record<string, string> = {
  'access-control-allow-origin': '指定允许跨域访问的源（* 表示任意源，或具体域名）',
  'access-control-allow-methods': '允许的 HTTP 方法列表',
  'access-control-allow-headers': '允许的请求头字段列表',
  'access-control-allow-credentials': '是否允许携带 Cookie/凭证（true/false）',
  'access-control-expose-headers': '允许前端读取的响应头字段列表',
  'access-control-max-age': '预检请求的缓存时间（秒）',
  'access-control-request-method': '预检请求中声明将要使用的 HTTP 方法',
  'access-control-request-headers': '预检请求中声明将要携带的自定义头字段',
  'access-control-allow-private-network': '是否允许从公共网络访问私有网络资源',
  'origin': '请求来源（浏览器自动设置）',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error('无 CORS 头内容');
      }
      const results: string[] = ['CORS 头解析:\n'];
      let corsCount = 0;
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const header = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();
        const explain = CORS_EXPLANATIONS[header];
        if (explain) {
          corsCount++;
          results.push(`${header}: ${value}`);
          results.push(`  说明: ${explain}`);
          results.push('');
        } else {
          results.push(`${header}: ${value}`);
          results.push('  说明: 非 CORS 相关头');
          results.push('');
        }
      }
      results.unshift(`CORS 头解析 (找到 ${corsCount} 个 CORS 相关头):\n`);
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
