import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      let queryStr = trimmed;
      if (trimmed.includes('?')) {
        queryStr = trimmed.slice(trimmed.indexOf('?') + 1);
      }
      const params = new URLSearchParams(queryStr);
      const entries = Array.from(params.entries());
      if (entries.length === 0) {
        throw new Error('未找到查询参数');
      }
      const grouped: Record<string, string[]> = {};
      for (const [k, v] of entries) {
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(v);
      }
      const lines: string[] = [`共 ${entries.length} 个参数 (${Object.keys(grouped).length} 个唯一键):\n`];
      for (const [k, vals] of Object.entries(grouped)) {
        if (vals.length === 1) {
          lines.push(`${k} = ${vals[0]}`);
        } else {
          lines.push(`${k} = [${vals.map((v) => `"${v}"`).join(', ')}] (${vals.length} 个值)`);
        }
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
