import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'bytesPerLine',
        label: '每行字节',
        type: 'select',
        default: '16',
        options: [
          { value: '8', label: '8' },
          { value: '16', label: '16' },
          { value: '32', label: '32' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const bpl = parseInt((params.bytesPerLine as string) ?? '16', 10) || 16;
      const bytes = getInputBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const maxBytes = Math.min(bytes.length, 8192);
      const lines: string[] = [];
      for (let offset = 0; offset < maxBytes; offset += bpl) {
        const slice = bytes.slice(offset, Math.min(offset + bpl, maxBytes));
        const hexPart = Array.from(slice)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join(' ')
          .padEnd(bpl * 3 - 1, ' ');
        lines.push(`${offset.toString(16).padStart(8, '0')}  ${hexPart}`);
      }
      if (bytes.length > maxBytes) {
        lines.push(`\n...(共 ${bytes.length} 字节，仅显示前 ${maxBytes} 字节)`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
