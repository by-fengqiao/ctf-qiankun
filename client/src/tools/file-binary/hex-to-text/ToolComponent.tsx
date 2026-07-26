import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const cleaned = input.replace(/\s/g, '').toLowerCase();
      if (cleaned.length === 0) throw new Error('输入为空');
      if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
      const bytes: number[] = [];
      for (let i = 0; i < cleaned.length; i += 2) {
        const byte = parseInt(cleaned.slice(i, i + 2), 16);
        if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${cleaned.slice(i, i + 2)}`);
        bytes.push(byte);
      }
      const uint8 = new Uint8Array(bytes);
      return new TextDecoder('utf-8').decode(uint8);
    }}
  />
);
export default ToolComponent;
