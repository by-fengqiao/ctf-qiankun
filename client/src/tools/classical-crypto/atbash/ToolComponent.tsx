import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      return input.replace(/[a-z]/gi, (c: string) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
      });
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
  />
);

export default ToolComponent;
