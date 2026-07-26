import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const CHART_W = 520;
const CHART_H = 220;

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入音频十六进制数据进行频率分析';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入音频十六进制数据进行频率分析';
      }
      if (bytes.length < 8) return '数据不足，至少需要 8 字节';
      const n = bytes.length;
      const sampleRate = 8000;
      const numBins = Math.min(16, Math.floor(n / 2));
      const magnitudes: number[] = [];
      for (let k = 0; k < numBins; k++) {
        let real = 0;
        let imag = 0;
        for (let t = 0; t < n; t++) {
          const angle = (-2 * Math.PI * k * t) / n;
          real += bytes[t] * Math.cos(angle);
          imag += bytes[t] * Math.sin(angle);
        }
        magnitudes.push(Math.sqrt(real * real + imag * imag) / n);
      }
      const maxMag = Math.max(...magnitudes, 1);
      const dominantBin = magnitudes.indexOf(Math.max(...magnitudes));
      const dominantFreq = (dominantBin * sampleRate) / n;

      const lines: string[] = [
        '音频频率分析',
        `数据字节数: ${n}`,
        `假设采样率: ${sampleRate} Hz`,
        `奈奎斯特频率: ${sampleRate / 2} Hz`,
        `主导频率: Bin ${dominantBin} = ${dominantFreq.toFixed(1)} Hz`,
        `最大幅值: ${maxMag.toFixed(4)}`,
        '',
        '── DFT 频率分量图 ──',
      ];

      const canvas = document.createElement('canvas');
      canvas.width = CHART_W;
      canvas.height = CHART_H;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CHART_W, CHART_H);
        const chartH = CHART_H - 40;
        const barW = (CHART_W - 40) / numBins;
        for (let k = 0; k < numBins; k++) {
          const h = (magnitudes[k] / maxMag) * chartH;
          const x = 20 + k * barW;
          ctx.fillStyle = `hsl(${(k / numBins) * 240}, 65%, 50%)`;
          ctx.fillRect(x, CHART_H - h - 25, barW - 4, h);
          ctx.fillStyle = '#3d4652';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          const freq = ((k * sampleRate) / n).toFixed(0);
          ctx.fillText(`${freq}Hz`, x + barW / 2, CHART_H - 8);
        }
        lines.push(canvas.toDataURL('image/png'));
      }

      lines.push('', '提示: 这是简化分析，实际 FFT 分析需要完整音频数据');
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
