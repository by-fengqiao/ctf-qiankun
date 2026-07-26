import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) throw new Error('输入为空');
      const bytes = getInputBytes(input);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const encoded = btoa(binary);
      return encoded.length > 5000
        ? encoded.slice(0, 5000) + `\n\n...(共 ${encoded.length} 字符，已截断显示前 5000 字符)`
        : encoded;
    }}
  />
);
export default ToolComponent;
