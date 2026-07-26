import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      const match = trimmed.match(/^[^{(]*\(([\s\S]*)\)\s*;?\s*$/);
      if (!match) {
        throw new Error('未找到 JSONP 回调包装 (callback(...))');
      }
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      const lines: string[] = [
        `回调函数: ${trimmed.slice(0, trimmed.indexOf('(')).trim() || '(匿名)'}`,
        '',
        '=== 解析结果 ===',
      ];
      if (typeof parsed === 'object' && parsed !== null) {
        lines.push(JSON.stringify(parsed, null, 2));
      } else {
        lines.push(String(parsed));
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
