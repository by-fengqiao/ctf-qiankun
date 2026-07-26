import { v4, v1 } from 'uuid';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'count', label: '数量', type: 'text', placeholder: '1', default: '1' },
      {
        name: 'version',
        label: '版本',
        type: 'select',
        default: 'v4',
        options: [
          { value: 'v4', label: 'UUID v4' },
          { value: 'v1', label: 'UUID v1' },
        ],
      },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const count = Math.min(100, Math.max(1, parseInt((params.count as string) ?? '1', 10) || 1));
      const version = (params.version as string) ?? 'v4';
      const uuids: string[] = [];
      for (let i = 0; i < count; i++) {
        uuids.push(version === 'v1' ? v1() : v4());
      }
      return uuids.join('\n');
    }}
  />
);
export default ToolComponent;
