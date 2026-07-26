import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const find = (params.find as string) || '';
        const replace = (params.replace as string) || '';
        if (!find) return input;
        return input.split(find).join(replace);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      { name: 'find', label: '查找', type: 'text', placeholder: '要查找的文本' },
      { name: 'replace', label: '替换', type: 'text', placeholder: '替换为' },
    ]}
  />
);

export default ToolComponent;
