import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const CHART_W = 512;
const CHART_H = 200;
const BAR_COUNT = 256;

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = getInputBytes(input);
      if (bytes.length === 0) return '请输入要统计字节频率的内容';
      const freq = new Array(256).fill(0);
      for (const b of bytes) {
        freq[b]++;
      }
      const maxFreq = Math.max(...freq);
      const uniqueCount = freq.filter((c: number) => c > 0).length;

      const lines: string[] = [
        `总字节数: ${bytes.length}`,
        `不同字节值数: ${uniqueCount}`,
        `最大频率: ${maxFreq} (0x${freq.indexOf(maxFreq).toString(16).padStart(2, '0')})`,
        '',
        '── 字节频率分布图 ──',
      ];

      const canvas = document.createElement('canvas');
      canvas.width = CHART_W;
      canvas.height = CHART_H;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CHART_W, CHART_H);
        const barW = CHART_W / BAR_COUNT;
        for (let i = 0; i < BAR_COUNT; i++) {
          if (freq[i] === 0) continue;
          const h = (freq[i] / maxFreq) * (CHART_H - 30);
          ctx.fillStyle = `hsl(${(i / 255) * 240}, 70%, 50%)`;
          ctx.fillRect(i * barW, CHART_H - h - 20, Math.max(barW - 0.5, 1), h);
        }
        ctx.fillStyle = '#7d8793';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('0x00', 2, CHART_H - 4);
        ctx.textAlign = 'right';
        ctx.fillText('0xFF', CHART_W - 2, CHART_H - 4);
        lines.push(canvas.toDataURL('image/png'));
      }

      lines.push('', '=== Top 20 频率最高字节 ===');
      const sorted = freq
        .map((count: number, byte: number) => ({ byte, count }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      for (const { byte, count } of sorted) {
        const pct = ((count / bytes.length) * 100).toFixed(2);
        const char = byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.';
        const hex = byte.toString(16).padStart(2, '0');
        lines.push(`0x${hex} (${char}) ${count.toString().padStart(5)} ${pct.padStart(6)}%`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
