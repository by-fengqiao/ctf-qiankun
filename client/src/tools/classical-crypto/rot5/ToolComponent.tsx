import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      return input.replace(/[0-9]/g, (c: string) =>
        String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48),
      );
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
  />
);

export default ToolComponent;
