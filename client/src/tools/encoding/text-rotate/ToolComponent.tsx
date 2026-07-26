import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const rot13 = (input: string): string =>
  Array.from(input, (c: string) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + 13) % 26) + 65);
    if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + 13) % 26) + 97);
    return c;
  }).join('');

const rot47 = (input: string): string =>
  Array.from(input, (c: string) => {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(((code - 33 + 47) % 94) + 33);
    return c;
  }).join('');

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'rot13';
        return type === 'rot47' ? rot47(input) : rot13(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '方式',
        type: 'select',
        default: 'rot13',
        options: [
          { value: 'rot13', label: 'ROT13' },
          { value: 'rot47', label: 'ROT47' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
