import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          return Array.from(input, (c: string) => c.charCodeAt(0)).join(' ');
        }
        if (!input.trim()) return '';
        const parts = input.trim().split(/\s+/);
        return parts.map((n: string) => String.fromCharCode(parseInt(n, 10))).join('');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
