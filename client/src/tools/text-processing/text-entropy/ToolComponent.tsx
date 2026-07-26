import CryptoJS from 'crypto-js';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入文本';
      const freq = new Map<string, number>();
      for (const ch of input) {
        freq.set(ch, (freq.get(ch) ?? 0) + 1);
      }
      const total = input.length;
      let entropy = 0;
      for (const count of freq.values()) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
      const maxEntropy = Math.log2(freq.size);
      const ratio = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
      const hash = CryptoJS.SHA256(input).toString();
      return [
        `Shannon 熵: ${entropy.toFixed(4)} bits/char`,
        `最大熵: ${maxEntropy.toFixed(4)} bits/char`,
        `熵比: ${ratio.toFixed(1)}%`,
        `文本长度: ${total}`,
        `唯一字符数: ${freq.size}`,
        `SHA-256: ${hash}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
