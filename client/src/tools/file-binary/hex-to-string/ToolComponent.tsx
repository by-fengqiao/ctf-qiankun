import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'decode', label: 'Hex→文本' },
      { value: 'encode', label: '文本→Hex' },
    ]}
    execute={(input: string, mode: string) => {
      if (!input) throw new Error('输入为空');
      if (mode === 'decode') {
        const hex = input.replace(/\s/g, '').toLowerCase();
        if (hex.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.slice(i, i + 2), 16);
          if (isNaN(code)) throw new Error(`无效的 Hex: ${hex.slice(i, i + 2)}`);
          result += String.fromCharCode(code);
        }
        return result;
      }
      const bytes = getInputBytes(input);
      return Array.from(bytes)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
    }}
  />
);
export default ToolComponent;
