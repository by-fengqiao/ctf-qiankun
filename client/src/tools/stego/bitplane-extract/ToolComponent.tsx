import AsyncTool from '../../_shared/AsyncTool';
import { decodeImage, getLuminance } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const MAX_DISPLAY_WIDTH = 80;
const MAX_DISPLAY_HEIGHT = 40;

function computeEntropy(bitCounts: number[], total: number): number {
  let entropy = 0;
  for (const count of bitCounts) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="位平面提取"
    paramsConfig={[
      {
        name: 'plane',
        label: '位平面',
        type: 'select',
        default: 'all',
        options: [
          { value: 'all', label: '全部 (0-7)' },
          { value: '0', label: 'Bit 0 (LSB)' },
          { value: '1', label: 'Bit 1' },
          { value: '2', label: 'Bit 2' },
          { value: '3', label: 'Bit 3' },
          { value: '4', label: 'Bit 4' },
          { value: '5', label: 'Bit 5' },
          { value: '6', label: 'Bit 6' },
          { value: '7', label: 'Bit 7 (MSB)' },
        ],
      },
    ]}
    execute={async (
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
      file?: File | null,
    ) => {
      if (!file) return '请拖入 PNG/BMP 图片文件';
      const { width, height, pixels } = await decodeImage(file, '');
      const pixelCount = width * height;
      const planeParam = (params.plane as string) || 'all';

      const results: string[] = [
        '位平面提取',
        `图片尺寸: ${width}×${height} px`,
        `像素数: ${pixelCount}`,
        '',
      ];

      // Extract luminance for each pixel
      const lumData = new Uint8Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        lumData[i] = getLuminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      }

      // Determine which planes to process
      const planes: number[] = [];
      if (planeParam === 'all') {
        for (let b = 0; b < 8; b++) planes.push(b);
      } else {
        planes.push(parseInt(planeParam, 10));
      }

      // Compute display dimensions (downsample)
      const displayW = Math.min(MAX_DISPLAY_WIDTH, width);
      const displayH = Math.min(MAX_DISPLAY_HEIGHT, height);
      const stepX = width / displayW;
      const stepY = height / displayH;

      results.push(`显示分辨率: ${displayW}×${displayH} (下采样)`);
      results.push('');

      for (const bit of planes) {
        const ones: number[] = new Array(256).fill(0);
        let totalOnes = 0;
        let totalBits = 0;

        // Count bits for statistics
        for (let i = 0; i < pixelCount; i++) {
          const val = lumData[i];
          ones[val]++;
          if ((val >> bit) & 1) {
            totalOnes++;
          }
          totalBits++;
        }

        // Bit distribution
        const bitCount = [0, 0];
        for (let i = 0; i < pixelCount; i++) {
          bitCount[(lumData[i] >> bit) & 1]++;
        }

        const ratio = totalBits > 0 ? totalOnes / totalBits : 0;
        const entropy = computeEntropy(bitCount, totalBits);

        results.push(`═══ Bit ${bit} (${bit === 0 ? 'LSB' : bit === 7 ? 'MSB' : '中间位'}) ═══`);
        results.push(`  1 的比例: ${(ratio * 100).toFixed(2)}%`);
        results.push(`  0 的数量: ${bitCount[0]}`);
        results.push(`  1 的数量: ${bitCount[1]}`);
        results.push(`  熵: ${entropy.toFixed(4)} bits`);

        // Stego detection for LSB
        if (bit === 0) {
          if (ratio > 0.48 && ratio < 0.52) {
            results.push('  ⚠ LSB 比特接近 50/50 — 可能含隐写数据 (随机/加密)');
          } else if (ratio > 0.45 && ratio < 0.55) {
            results.push('  ? LSB 比特分布较均匀 — 可能含隐写');
          } else {
            results.push('  ✓ LSB 分布偏向一方 — 可能不含隐写');
          }
          // Check for patterns: count transitions
          let transitions = 0;
          for (let i = 1; i < pixelCount; i++) {
            const prev = lumData[i - 1] & 1;
            const curr = lumData[i] & 1;
            if (prev !== curr) transitions++;
          }
          const transRate = transitions / (pixelCount - 1);
          results.push(`  转换率: ${(transRate * 100).toFixed(2)}% (高=随机/隐写, 低=自然图像)`);
          if (transRate > 0.45) {
            results.push('  ⚠ 高转换率 — LSB 可能含随机隐写数据');
          }
        }

        // ASCII visualization
        results.push('', `  ── Bit ${bit} 可视化 ──`);
        const matrixLines: string[] = [];
        for (let dy = 0; dy < displayH; dy++) {
          let line = '';
          for (let dx = 0; dx < displayW; dx++) {
            const px = Math.floor(dx * stepX);
            const py = Math.floor(dy * stepY);
            const idx = py * width + px;
            const val = lumData[idx];
            const bitVal = (val >> bit) & 1;
            line += bitVal ? '█' : ' ';
          }
          matrixLines.push(line);
        }
        results.push(...matrixLines.map((l) => `  ${l}`));
        results.push('');
      }

      // Summary comparison
      if (planeParam === 'all') {
        results.push('═══ 全部位平面对比 ═══');
        results.push('  Bit    1的比例    熵       转换率    评估');
        for (let bit = 0; bit < 8; bit++) {
          let ones = 0;
          let transitions = 0;
          for (let i = 0; i < pixelCount; i++) {
            if ((lumData[i] >> bit) & 1) ones++;
            if (i > 0 && ((lumData[i] >> bit) & 1) !== ((lumData[i - 1] >> bit) & 1)) {
              transitions++;
            }
          }
          const r = ones / pixelCount;
          const transRate = transitions / (pixelCount - 1);
          const bc = [pixelCount - ones, ones];
          const e = computeEntropy(bc, pixelCount);
          let assessment = '';
          if (bit === 0 && r > 0.48 && r < 0.52 && transRate > 0.45) {
            assessment = '⚠ 疑似隐写';
          } else if (bit === 7) {
            assessment = '自然图像';
          } else {
            assessment = '—';
          }
          results.push(
            `  Bit ${bit}  ${(r * 100).toFixed(2).padStart(7)}%  ${e.toFixed(4).padStart(7)}  ${(transRate * 100).toFixed(2).padStart(6)}%  ${assessment}`,
          );
        }
        results.push('', '提示: LSB (Bit 0) 若分布均匀且转换率高，可能含隐写数据');
        results.push('      高位平面 (Bit 6-7) 反映图像主要内容');
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
