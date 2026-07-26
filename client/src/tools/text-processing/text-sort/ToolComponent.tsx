import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'alpha', label: '字母排序' },
      { value: 'numeric', label: '数字排序' },
      { value: 'length', label: '长度排序' },
    ]}
    paramsConfig={[
      {
        name: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'asc', label: '升序' },
          { value: 'desc', label: '降序' },
        ],
        default: 'asc',
      },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const direction = (params.direction as string) ?? 'asc';
      const lines = input.split('\n');
      const dirMul = direction === 'desc' ? -1 : 1;
      const sorted = [...lines];
      if (mode === 'numeric') {
        sorted.sort((a: string, b: string) => {
          const na = parseFloat(a.trim()) || 0;
          const nb = parseFloat(b.trim()) || 0;
          return (na - nb) * dirMul;
        });
      } else if (mode === 'length') {
        sorted.sort((a: string, b: string) => (a.length - b.length) * dirMul);
      } else {
        sorted.sort((a: string, b: string) => a.localeCompare(b) * dirMul);
      }
      return sorted.join('\n');
    }}
  />
);

export default ToolComponent;
