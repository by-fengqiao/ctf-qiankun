import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const cleaned = input.replace(/\s/g, '').toLowerCase();
      if (cleaned.length === 0) throw new Error('输入为空');
      if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
      const pairs: string[] = [];
      for (let i = 0; i < cleaned.length; i += 2) {
        const pair = cleaned.slice(i, i + 2);
        const byte = parseInt(pair, 16);
        if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${pair}`);
        pairs.push(pair);
      }
      return pairs.reverse().join('');
    }}
  />
);
export default ToolComponent;
