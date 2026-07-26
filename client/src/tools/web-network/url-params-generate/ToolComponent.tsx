import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error('请输入 key=value 行（每行一个参数）');
      }
      const params = new URLSearchParams();
      for (const line of lines) {
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) {
          throw new Error(`行 "${line}" 缺少 = 分隔符`);
        }
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim();
        params.append(key, value);
      }
      const queryString = params.toString();
      return `?${queryString}`;
    }}
  />
);

export default ToolComponent;
