import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = getInputBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const freq = new Map<number, number>();
      for (const b of bytes) {
        freq.set(b, (freq.get(b) ?? 0) + 1);
      }
      let entropy = 0;
      for (const count of freq.values()) {
        const p = count / bytes.length;
        entropy -= p * Math.log2(p);
      }
      const maxEntropy = Math.log2(Math.min(bytes.length, 256));
      const ratio = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
      const lines: string[] = [
        `Shannon 熵: ${entropy.toFixed(6)} bits/byte`,
        `最大可能熵: ${maxEntropy.toFixed(6)} bits/byte`,
        `熵占比: ${ratio.toFixed(2)}%`,
        `不同字节值数: ${freq.size} / 256`,
        `总字节数: ${bytes.length}`,
      ];
      if (ratio > 95) {
        lines.push('\n⚠️ 熵值极高，数据可能是加密或压缩的');
      } else if (ratio < 40) {
        lines.push('\nℹ️ 熵值较低，数据可能是文本或结构化数据');
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
