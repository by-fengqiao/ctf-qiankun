import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const shift = parseInt((params.shift as string) || '3', 10);
      const isDecrypt = mode === 'decrypt';
      const actualShift = isDecrypt ? -shift : shift;
      return input.replace(/[a-z]/gi, (c: string) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(
          ((c.charCodeAt(0) - base + actualShift + 26) % 26) + base,
        );
      });
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'shift', label: '位移', type: 'text', placeholder: '3', default: '3' },
    ]}
  />
);

export default ToolComponent;
