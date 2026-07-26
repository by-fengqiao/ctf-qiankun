import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'minLength',
        label: '最小长度',
        type: 'text',
        default: '4',
        placeholder: '4',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const minLen = Math.max(1, parseInt((params.minLength as string) ?? '4', 10) || 4);
      const bytes = getInputBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const results: string[] = [];
      let current = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b >= 32 && b <= 126) {
          current += String.fromCharCode(b);
        } else {
          if (current.length >= minLen) results.push(current);
          current = '';
        }
      }
      if (current.length >= minLen) results.push(current);
      if (results.length === 0) return '未找到符合最小长度的字符串';
      return `=== 提取到 ${results.length} 个字符串 ===\n${results.join('\n')}`;
    }}
  />
);
export default ToolComponent;
