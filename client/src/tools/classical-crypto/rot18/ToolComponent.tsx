import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      return input.replace(/[a-z0-9]/gi, (c: string) => {
        if (/[0-9]/.test(c)) {
          return String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48);
        }
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
  />
);

export default ToolComponent;
