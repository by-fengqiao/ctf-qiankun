import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

interface ColorEntry {
  hex: string;
  r: number;
  g: number;
  b: number;
  count: number;
}

const colorKey = (r: number, g: number, b: number): string =>
  `${r},${g},${b}`;

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      { name: 'count', label: '颜色数', type: 'text', placeholder: '1-64', default: '8' },
    ]}
    execute={async (input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      const count = Math.max(1, Math.min(64, parseInt((params.count as string) || '8', 10)));
      if (file) {
        const { imageData } = await loadImageToCanvas(file);
        const data = imageData.data;
        const colorMap = new Map<string, ColorEntry>();
        const step = Math.max(4, Math.floor(data.length / 4 / 50000) * 4);
        for (let i = 0; i < data.length; i += step) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const key = colorKey(r, g, b);
          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, { hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase(), r, g, b, count: 1 });
          }
        }
        const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count).slice(0, count);
        const total = sorted.reduce((sum, c) => sum + c.count, 0);
        const results: string[] = [
          `调色板提取 (Top ${sorted.length})`,
          `图片尺寸: ${imageData.width} × ${imageData.height}`,
          '',
        ];
        for (const c of sorted) {
          const pct = ((c.count / total) * 100).toFixed(1);
          results.push(`  ${c.hex}  rgb(${c.r}, ${c.g}, ${c.b})  ${pct}%`);
        }
        return results.join('\n');
      }
      if (!input) return '请拖入图片文件或输入十六进制颜色数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请拖入图片文件或输入十六进制颜色数据';
      }
      if (bytes.length < 3) return '数据不足，至少需要 3 字节';
      const pixelCount = Math.floor(bytes.length / 3);
      const colorMap = new Map<string, ColorEntry>();
      for (let i = 0; i < pixelCount; i++) {
        const r = bytes[i * 3], g = bytes[i * 3 + 1], b = bytes[i * 3 + 2];
        const key = colorKey(r, g, b);
        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(key, { hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase(), r, g, b, count: 1 });
        }
      }
      const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count).slice(0, count);
      const results: string[] = [
        `调色板提取 (Top ${sorted.length})`,
        `像素数量: ${pixelCount}`,
        '',
      ];
      for (const c of sorted) {
        const pct = ((c.count / pixelCount) * 100).toFixed(1);
        results.push(`  ${c.hex}  rgb(${c.r}, ${c.g}, ${c.b})  ${pct}%`);
      }
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
