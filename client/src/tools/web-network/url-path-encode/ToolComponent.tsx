import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'encode') {
        const segments = input.split('/').map((seg) => encodeURIComponent(seg));
        return segments.join('/');
      }
      const segments = input.split('/').map((seg) => decodeURIComponent(seg));
      return segments.join('/');
    }}
  />
);

export default ToolComponent;
