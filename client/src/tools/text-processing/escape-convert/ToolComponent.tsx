import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const UNESCAPE_MAP: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
  '0': '\0',
  b: '\b',
  f: '\f',
  v: '\v',
  '"': '"',
  "'": "'",
  '\\': '\\',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'escape', label: '转义' },
      { value: 'unescape', label: '反转义' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'unescape') {
        let result = '';
        for (let i = 0; i < input.length; i++) {
          if (input[i] === '\\' && i + 1 < input.length) {
            const next: string = input[i + 1];
            result += UNESCAPE_MAP[next] ?? next;
            i++;
          } else {
            result += input[i];
          }
        }
        return result;
      }
      return input
        .replace(/\\/gu, '\\\\')
        .replace(/\n/gu, '\\n')
        .replace(/\t/gu, '\\t')
        .replace(/\r/gu, '\\r')
        .replace(/"/gu, '\\"')
        .replace(/'/gu, "\\'");
    }}
  />
);

export default ToolComponent;
