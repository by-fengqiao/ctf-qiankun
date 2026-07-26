import AsyncTool from '../../_shared/AsyncTool';
import { decodeImage, getLuminance } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

function computeEntropy(counts: number[], total: number): number {
  let entropy = 0;
  for (const count of counts) {
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
    toolName="直方图分析"
    execute={async (
      _input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      if (!file) return '请拖入 PNG/JPEG 图片文件';
      const { width, height, pixels } = await decodeImage(file, '');
      const pixelCount = width * height;

      const results: string[] = [
        '图像直方图分析',
        `图片尺寸: ${width}×${height} px`,
        `像素数: ${pixelCount}`,
        '',
      ];

      // Build RGB + luminance histograms
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      const histLum = new Array(256).fill(0);

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumLum = 0;
      let sumSqR = 0;
      let sumSqG = 0;
      let sumSqB = 0;
      let sumSqLum = 0;

      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const lum = getLuminance(r, g, b);

        histR[r]++;
        histG[g]++;
        histB[b]++;
        histLum[lum]++;

        sumR += r;
        sumG += g;
        sumB += b;
        sumLum += lum;
        sumSqR += r * r;
        sumSqG += g * g;
        sumSqB += b * b;
        sumSqLum += lum * lum;
      }

      const meanR = sumR / pixelCount;
      const meanG = sumG / pixelCount;
      const meanB = sumB / pixelCount;
      const meanLum = sumLum / pixelCount;

      const varR = sumSqR / pixelCount - meanR * meanR;
      const varG = sumSqG / pixelCount - meanG * meanG;
      const varB = sumSqB / pixelCount - meanB * meanB;
      const stdR = Math.sqrt(Math.max(0, varR));
      const stdG = Math.sqrt(Math.max(0, varG));
      const stdB = Math.sqrt(Math.max(0, varB));
      const varLum = sumSqLum / pixelCount - meanLum * meanLum;
      const stdLum = Math.sqrt(Math.max(0, varLum));

      // Entropy
      const entR = computeEntropy(histR, pixelCount);
      const entG = computeEntropy(histG, pixelCount);
      const entB = computeEntropy(histB, pixelCount);
      const entLum = computeEntropy(histLum, pixelCount);

      // Unique values
      let uniqueR = 0;
      let uniqueG = 0;
      let uniqueB = 0;
      let uniqueLum = 0;
      for (let i = 0; i < 256; i++) {
        if (histR[i] > 0) uniqueR++;
        if (histG[i] > 0) uniqueG++;
        if (histB[i] > 0) uniqueB++;
        if (histLum[i] > 0) uniqueLum++;
      }

      // Min / max
      let minR = 255;
      let maxR = 0;
      let minG = 255;
      let maxG = 0;
      let minB = 255;
      let maxB = 0;
      for (let i = 0; i < 256; i++) {
        if (histR[i] > 0) { minR = Math.min(minR, i); maxR = Math.max(maxR, i); }
        if (histG[i] > 0) { minG = Math.min(minG, i); maxG = Math.max(maxG, i); }
        if (histB[i] > 0) { minB = Math.min(minB, i); maxB = Math.max(maxB, i); }
      }

      results.push('── 基本统计 ──');
      results.push('           R          G          B          Luminance');
      results.push(`  均值   ${meanR.toFixed(1).padStart(8)}   ${meanG.toFixed(1).padStart(8)}   ${meanB.toFixed(1).padStart(8)}   ${meanLum.toFixed(1).padStart(8)}`);
      results.push(`  标准差 ${stdR.toFixed(1).padStart(8)}   ${stdG.toFixed(1).padStart(8)}   ${stdB.toFixed(1).padStart(8)}   ${stdLum.toFixed(1).padStart(8)}`);
      results.push(`  熵     ${entR.toFixed(4).padStart(8)}   ${entG.toFixed(4).padStart(8)}   ${entB.toFixed(4).padStart(8)}   ${entLum.toFixed(4).padStart(8)}`);
      results.push(`  最小值 ${minR.toString().padStart(8)}   ${minG.toString().padStart(8)}   ${minB.toString().padStart(8)}`);
      results.push(`  最大值 ${maxR.toString().padStart(8)}   ${maxG.toString().padStart(8)}   ${maxB.toString().padStart(8)}`);
      results.push(`  唯一值 ${uniqueR.toString().padStart(8)}   ${uniqueG.toString().padStart(8)}   ${uniqueB.toString().padStart(8)}   ${uniqueLum.toString().padStart(8)}`);
      results.push('');

      // ASCII histogram visualization (luminance, 64 bins downsampled)
      results.push('── 亮度直方图 (ASCII) ──');
      const histDisplayBins = 64;
      const binSize = 256 / histDisplayBins;
      const displayBins: number[] = new Array(histDisplayBins).fill(0);
      for (let i = 0; i < 256; i++) {
        const bin = Math.min(histDisplayBins - 1, Math.floor(i / binSize));
        displayBins[bin] += histLum[i];
      }
      const maxBin = Math.max(...displayBins, 1);
      const HIST_HEIGHT = 15;
      for (let row = HIST_HEIGHT; row >= 0; row--) {
        const threshold = (row / HIST_HEIGHT) * maxBin;
        let line = '';
        for (let b = 0; b < histDisplayBins; b++) {
          line += displayBins[b] >= threshold ? '█' : ' ';
        }
        results.push(`  ${line}`);
      }
      results.push(`  ${'0'.padEnd(31)}64${'128'.padStart(16)}${'192'.padStart(16)}${'255'.padStart(16)}`);
      results.push('');

      // Steganography detection
      results.push('── 隐写检测 ──');

      // 1. LSB plane uniformity
      let lsbOnes = 0;
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        const lum = getLuminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
        if (lum & 1) lsbOnes++;
      }
      const lsbRatio = lsbOnes / pixelCount;
      results.push(`  LSB (Bit 0) 1 的比例: ${(lsbRatio * 100).toFixed(2)}%`);
      if (lsbRatio > 0.49 && lsbRatio < 0.51) {
        results.push('  ⚠ LSB 分布接近 50/50 — 疑似隐写 (随机嵌入)');
      } else if (lsbRatio > 0.47 && lsbRatio < 0.53) {
        results.push('  ? LSB 分布较均匀 — 可能有隐写');
      } else {
        results.push('  ✓ LSB 分布偏向一方 — 自然图像特征');
      }
      results.push('');

      // 2. Near-empty bins detection
      let emptyBins = 0;
      let nearEmptyBins = 0;
      for (let i = 0; i < 256; i++) {
        if (histLum[i] === 0) emptyBins++;
        else if (histLum[i] < pixelCount * 0.0001) nearEmptyBins++;
      }
      results.push(`  空直方图区间: ${emptyBins}/256 (${((emptyBins / 256) * 100).toFixed(1)}%)`);
      results.push(`  近空区间: ${nearEmptyBins}/256`);
      if (emptyBins < 50 && uniqueLum > 200) {
        results.push('  ⚠ 直方图几乎填满所有区间 — 可能含隐写 (LSB 嵌入会填充偶数区间)');
      }
      results.push('');

      // 3. Chi-square attack (Pairs of Values / PoVs)
      // Compare adjacent even/odd value pairs
      const chiResults: { pair: string; even: number; odd: number; ratio: number }[] = [];
      for (let i = 0; i < 256; i += 2) {
        const even = histLum[i];
        const odd = histLum[i + 1];
        const total = even + odd;
        const ratio = total > 0 ? Math.abs(even - odd) / total : 0;
        chiResults.push({ pair: `${i}-${i + 1}`, even, odd, ratio });
      }
      const avgRatio = chiResults.reduce((sum, r) => sum + r.ratio, 0) / chiResults.length;
      results.push(`  卡方攻击 (PoV) 平均偏差: ${avgRatio.toFixed(4)}`);
      if (avgRatio < 0.05) {
        results.push('  ⚠ 偶/奇值对高度一致 — 强隐写嫌疑 (卡方检测阳性)');
      } else if (avgRatio < 0.15) {
        results.push('  ? 偶/奇值对较一致 — 可能有隐写');
      } else {
        results.push('  ✓ 偶/奇值对偏差较大 — 自然图像特征');
      }
      results.push('');

      // 4. Value pair analysis detail (first 16 pairs)
      results.push('  偶/奇值对分析 (前 16 对):');
      results.push('  对      偶数计数     奇数计数     偏差');
      for (let i = 0; i < Math.min(16, chiResults.length); i++) {
        const r = chiResults[i];
        results.push(`  ${r.pair.padStart(5)}   ${r.even.toString().padStart(10)}   ${r.odd.toString().padStart(10)}   ${r.ratio.toFixed(4)}`);
      }
      results.push('');

      // 5. Overall assessment
      let stegoScore = 0;
      if (lsbRatio > 0.49 && lsbRatio < 0.51) stegoScore += 2;
      else if (lsbRatio > 0.47 && lsbRatio < 0.53) stegoScore += 1;
      if (emptyBins < 50 && uniqueLum > 200) stegoScore += 2;
      if (avgRatio < 0.05) stegoScore += 3;
      else if (avgRatio < 0.15) stegoScore += 1;

      results.push('── 综合评估 ──');
      results.push(`  隐写嫌疑分数: ${stegoScore}/7`);
      if (stegoScore >= 5) {
        results.push('  ⚠⚠ 高隐写嫌疑 — 多项指标异常');
      } else if (stegoScore >= 3) {
        results.push('  ⚠ 中等隐写嫌疑 — 部分指标异常');
      } else if (stegoScore >= 1) {
        results.push('  ? 低隐写嫌疑 — 个别指标偏离');
      } else {
        results.push('  ✓ 未检测到隐写特征');
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
