import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const toFullWidth = (input: string): string => {
  let result = '';
  for (const ch of Array.from(input)) {
    const code = ch.charCodeAt(0);
    if (code === 0x20) {
      result += '\u3000';
    } else if (code >= 0x21 && code <= 0x7e) {
      result += String.fromCharCode(code + 0xfee0);
    } else {
      result += ch;
    }
  }
  return result;
};

const toHalfWidth = (input: string): string => {
  let result = '';
  for (const ch of Array.from(input)) {
    const code = ch.charCodeAt(0);
    if (code === 0x3000) {
      result += ' ';
    } else if (code >= 0xff01 && code <= 0xff5e) {
      result += String.fromCharCode(code - 0xfee0);
    } else {
      result += ch;
    }
  }
  return result;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'full';
        return type === 'full' ? toFullWidth(input) : toHalfWidth(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '类型',
        type: 'select',
        default: 'full',
        options: [
          { value: 'full', label: '转全角' },
          { value: 'half', label: '转半角' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
