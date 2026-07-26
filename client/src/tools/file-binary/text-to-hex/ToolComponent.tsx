import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'separator',
        label: '分隔符',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: '无' },
          { value: 'space', label: '空格' },
          { value: '0x', label: '0x 前缀' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const sep = (params.separator as string) ?? 'none';
      const bytes = getInputBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const hexStrings = Array.from(bytes).map((b: number) =>
        b.toString(16).padStart(2, '0'),
      );
      if (sep === 'space') {
        return hexStrings.join(' ');
      }
      if (sep === '0x') {
        return hexStrings.map((h: string) => `0x${h}`).join(' ');
      }
      return hexStrings.join('');
    }}
  />
);
export default ToolComponent;
