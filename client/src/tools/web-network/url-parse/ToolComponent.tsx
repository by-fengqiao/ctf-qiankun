import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const url = new URL(input.trim());
      const lines: string[] = [];
      lines.push(`协议: ${url.protocol}`);
      lines.push(`用户名: ${url.username || '(无)'}`);
      lines.push(`密码: ${url.password ? '******' : '(无)'}`);
      lines.push(`主机: ${url.hostname}`);
      lines.push(`端口: ${url.port || '(默认)'}`);
      lines.push(`源: ${url.origin}`);
      lines.push(`路径: ${url.pathname}`);
      lines.push(`查询: ${url.search || '(无)'}`);
      lines.push(`片段: ${url.hash || '(无)'}`);
      const params = new URLSearchParams(url.searchParams);
      if (params.toString()) {
        lines.push('');
        lines.push('查询参数:');
        for (const [k, v] of params.entries()) {
          lines.push(`  ${k} = ${v}`);
        }
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
