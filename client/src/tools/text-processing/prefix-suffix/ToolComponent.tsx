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
      { name: 'prefix', label: '前缀', type: 'text', placeholder: '前缀...', default: '' },
      { name: 'suffix', label: '后缀', type: 'text', placeholder: '后缀...', default: '' },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const prefix = (params.prefix as string) ?? '';
      const suffix = (params.suffix as string) ?? '';
      const lines = input.split('\n');
      if (mode === 'decode') {
        return lines
          .map((line: string) => {
            let result = line;
            if (prefix && result.startsWith(prefix)) {
              result = result.slice(prefix.length);
            }
            if (suffix && result.endsWith(suffix)) {
              result = result.slice(0, -suffix.length);
            }
            return result;
          })
          .join('\n');
      }
      return lines.map((line: string) => `${prefix}${line}${suffix}`).join('\n');
    }}
  />
);

export default ToolComponent;
