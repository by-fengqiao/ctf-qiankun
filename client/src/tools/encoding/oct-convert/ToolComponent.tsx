import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          const bytes = new TextEncoder().encode(input);
          return Array.from(bytes, (b: number) => b.toString(8)).join(' ');
        }
        if (!input.trim()) return '';
        const parts = input.trim().split(/\s+/);
        const bytes = new Uint8Array(parts.map((o: string) => parseInt(o, 8)));
        return new TextDecoder().decode(bytes);
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
