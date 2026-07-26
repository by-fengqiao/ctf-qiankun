import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '添加' },
      { value: 'decode', label: '移除' },
    ]}
    paramsConfig={[
      { name: 'start', label: '起始', type: 'text', placeholder: '1', default: '1' },
      {
        name: 'separator',
        label: '分隔符',
        type: 'select',
        options: [
          { value: ': ', label: ': ' },
          { value: '. ', label: '. ' },
          { value: ' | ', label: ' | ' },
          { value: '\t', label: 'Tab' },
        ],
        default: ': ',
      },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const lines = input.split('\n');
      const separator = (params.separator as string) ?? ': ';
      if (mode === 'decode') {
        return lines
          .map((line: string) => line.replace(/^\d+[:.\t \-|]+/u, ''))
          .join('\n');
      }
      const start = parseInt((params.start as string) ?? '1', 10) || 1;
      const width = String(start + lines.length - 1).length;
      return lines
        .map((line: string, i: number) => `${String(start + i).padStart(width)}${separator}${line}`)
        .join('\n');
    }}
  />
);

export default ToolComponent;
