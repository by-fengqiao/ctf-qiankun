import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '转义' },
      { value: 'decode', label: '反转义' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'encode') {
        const escaped = input
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"')
          .replace(/\0/g, '\\0')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `'${escaped}'`;
      }
      let result = input.trim();
      if (result.startsWith("'") && result.endsWith("'")) {
        result = result.slice(1, -1);
      } else if (result.startsWith('"') && result.endsWith('"')) {
        result = result.slice(1, -1);
      }
      const unescaped = result.replace(/\\([\\nrt0'"])/g, (m, ch) =>
        ({ '\\': '\\', n: '\n', r: '\r', t: '\t', '0': '\0', "'": "'", '"': '"' })[ch as string] ?? m,
      );
      return unescaped;
    }}
  />
);

export default ToolComponent;
