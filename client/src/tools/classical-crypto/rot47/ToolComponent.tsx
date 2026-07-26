import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      let result = '';
      for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (code >= 33 && code <= 126) {
          result += String.fromCharCode(((code - 33 + 47) % 94) + 33);
        } else {
          result += input[i];
        }
      }
      return result;
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
  />
);

export default ToolComponent;
