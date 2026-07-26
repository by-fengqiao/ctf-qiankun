import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ENGLISH_FREQ: Record<string, number> = {
  A: 8.167, B: 1.492, C: 2.782, D: 4.253, E: 12.702,
  F: 2.228, G: 2.015, H: 6.094, I: 6.966, J: 0.153,
  K: 0.772, L: 4.025, M: 2.406, N: 6.749, O: 7.507,
  P: 1.929, Q: 0.095, R: 5.987, S: 6.327, T: 9.056,
  U: 2.758, V: 0.978, W: 2.360, X: 0.150, Y: 1.974, Z: 0.074,
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const text = input.toUpperCase().replace(/[^A-Z]/g, '');
      if (text.length === 0) return '无字母可分析';

      // Count frequencies
      const counts: Record<string, number> = {};
      for (let i = 0; i < 26; i++) {
        counts[String.fromCharCode(65 + i)] = 0;
      }
      for (const ch of text) counts[ch]++;
      const total = text.length;

      // Sort by count descending
      const sorted = Object.entries(counts)
        .filter(([, v]: [string, number]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

      const lines: string[] = [];
      lines.push('=== 字母频率分析 ===');
      lines.push(`总字母数: ${total}`);
      lines.push(`不同字母数: ${sorted.length}`);
      lines.push('');

      lines.push('字母 | 出现次数 | 频率% | 英语频率% | 可能对应');
      lines.push('----|---------|-------|----------|-------');
      // Suggest mapping: most frequent -> E, T, A, O, I, N...
      const engOrder = 'ETAOINSRHLDCUMFPGWYBVKJXQZ';
      sorted.forEach(([letter, count]: [string, number], idx: number) => {
        const freq = ((count / total) * 100).toFixed(2);
        const engLetter = engOrder[idx] ?? '-';
        const engFreq = ENGLISH_FREQ[engLetter]?.toFixed(3) ?? '-';
        lines.push(
          `  ${letter}  |   ${String(count).padStart(3)}    | ${freq.padStart(5)} |  ${String(engFreq).padStart(7)} |    ${engLetter}`,
        );
      });

      lines.push('');
      lines.push('=== 双字母组 (Bigrams) ===');
      const bigrams: Record<string, number> = {};
      for (let i = 0; i < text.length - 1; i++) {
        const bg = text.slice(i, i + 2);
        bigrams[bg] = (bigrams[bg] ?? 0) + 1;
      }
      const topBigrams = Object.entries(bigrams)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      topBigrams.forEach(([bg, count]: [string, number]) => {
        lines.push(`  ${bg}: ${count}`);
      });

      lines.push('');
      lines.push('=== 三字母组 (Trigrams) ===');
      const trigrams: Record<string, number> = {};
      for (let i = 0; i < text.length - 2; i++) {
        const tg = text.slice(i, i + 3);
        trigrams[tg] = (trigrams[tg] ?? 0) + 1;
      }
      const topTrigrams = Object.entries(trigrams)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      topTrigrams.forEach(([tg, count]: [string, number]) => {
        lines.push(`  ${tg}: ${count}`);
      });

      lines.push('');
      lines.push('=== 索引重合度 (IC) ===');
      let ic = 0;
      for (const [, count] of Object.entries(counts)) {
        ic += count * (count - 1);
      }
      ic = ic / (total * (total - 1));
      lines.push(`IC = ${ic.toFixed(4)}`);
      if (ic > 0.066) {
        lines.push('→ IC 接近英语(0.0667)，可能是单表替换密码');
      } else if (ic > 0.045) {
        lines.push('→ IC 介于单表和多表之间，可能是有较短密钥的多表密码');
      } else {
        lines.push('→ IC 接近随机(0.038)，可能是多表替换密码');
      }

      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
