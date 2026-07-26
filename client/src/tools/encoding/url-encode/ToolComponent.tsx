import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          return encodeURIComponent(input);
        }
        return decodeURIComponent(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
