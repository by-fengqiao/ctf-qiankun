import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const PIXEL = 4;

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入两组像素数据，用 \\n---\\n 分隔';
      const parts = input.split(/\n *--- *\n/);
      if (parts.length !== 2) {
        return '请用 \\n---\\n 分隔两组像素数据（两组 RGB 十六进制）';
      }
      let a: Uint8Array;
      let b: Uint8Array;
      try {
        a = parseHex(parts[0].trim());
        b = parseHex(parts[1].trim());
      } catch {
        return '请输入有效的十六进制像素数据';
      }
      const aPixels = Math.floor(a.length / 3);
      const bPixels = Math.floor(b.length / 3);
      if (aPixels === 0 || bPixels === 0) return '数据不足，至少需要 3 字节';
      const minPixels = Math.min(aPixels, bPixels);
      const width = Math.ceil(Math.sqrt(minPixels));
      const height = Math.ceil(minPixels / width);
      const canvasW = width * PIXEL * 3 + 20;
      const canvasH = height * PIXEL + 30;

      let diffCount = 0;
      let maxDiff = 0;
      let totalDiff = 0;
      const diffs: string[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      const sections = ['A', 'B', 'Diff'];
      const offsets = [0, width * PIXEL + 10, (width * PIXEL + 10) * 2];

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
        for (let i = 0; i < minPixels; i++) {
          const px = i % width;
          const py = Math.floor(i / width);
          const ar = a[i * 3], ag = a[i * 3 + 1], ab = a[i * 3 + 2];
          const br = b[i * 3], bg = b[i * 3 + 1], bb = b[i * 3 + 2];
          const dr = Math.abs(ar - br);
          const dg = Math.abs(ag - bg);
          const db = Math.abs(ab - bb);
          const pixelDiff = dr + dg + db;
          if (pixelDiff > 0) {
            diffCount++;
            totalDiff += pixelDiff;
            if (pixelDiff > maxDiff) maxDiff = pixelDiff;
            if (diffs.length < 10) {
              diffs.push(
                `  像素 ${i}: (${ar},${ag},${ab}) vs (${br},${bg},${bb}) 差异=${dr},${dg},${db}`,
              );
            }
          }
          ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
          ctx.fillRect(offsets[0] + px * PIXEL, py * PIXEL + 20, PIXEL, PIXEL);
          ctx.fillStyle = `rgb(${br},${bg},${bb})`;
          ctx.fillRect(offsets[1] + px * PIXEL, py * PIXEL + 20, PIXEL, PIXEL);
          const diffIntensity = pixelDiff / 765;
          ctx.fillStyle = `rgb(${Math.round(diffIntensity * 255)}, 0, 0)`;
          ctx.fillRect(offsets[2] + px * PIXEL, py * PIXEL + 20, PIXEL, PIXEL);
        }
        ctx.fillStyle = '#3d4652';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        sections.forEach((label, idx) => {
          ctx.fillText(label, offsets[idx] + (width * PIXEL) / 2, 14);
        });
      }

      const lines: string[] = [
        '像素差异对比',
        `图像 A: ${aPixels} 像素`,
        `图像 B: ${bPixels} 像素`,
        `对比像素: ${minPixels}`,
        '',
        '── 差异统计 ──',
        `差异像素: ${diffCount}/${minPixels} (${((diffCount / minPixels) * 100).toFixed(1)}%)`,
        `最大差异: ${maxDiff}`,
        `平均差异: ${diffCount > 0 ? (totalDiff / diffCount).toFixed(2) : 0}`,
        '',
        '── 可视化对比 (A | B | Diff) ──',
      ];
      if (ctx) {
        lines.push(canvas.toDataURL('image/png'));
      }
      lines.push('', '── 前 10 个差异 ──', ...(diffs.length > 0 ? diffs : ['  无差异']));
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
