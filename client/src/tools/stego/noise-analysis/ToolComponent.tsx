import AsyncTool from '../../_shared/AsyncTool';
import { decodeImage, getLuminance } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const NOISE_CHARS = ' .:oO0@';
const MAX_DISPLAY_WIDTH = 80;
const MAX_DISPLAY_HEIGHT = 40;

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="隐写噪声分析"
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
        '图像噪声分析',
        `图片尺寸: ${width}×${height} px`,
        `像素数: ${pixelCount}`,
        '',
      ];

      // 1. Compute luminance map
      const lumData = new Uint8Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        lumData[i] = getLuminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      }

      // 2. Noise residual (high-pass filter): residual = pixel - average of neighbors
      const residual = new Float32Array(pixelCount);
      let sumResidual = 0;
      let sumSqResidual = 0;
      let maxResidual = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            residual[idx] = 0;
            continue;
          }
          // 3x3 average
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              sum += lumData[(y + dy) * width + (x + dx)];
              count++;
            }
          }
          const avg = sum / count;
          const res = lumData[idx] - avg;
          residual[idx] = res;
          sumResidual += res;
          sumSqResidual += res * res;
          const absRes = Math.abs(res);
          if (absRes > maxResidual) maxResidual = absRes;
        }
      }

      const meanResidual = sumResidual / pixelCount;
      const varResidual = sumSqResidual / pixelCount - meanResidual * meanResidual;
      const stdResidual = Math.sqrt(Math.max(0, varResidual));

      results.push('── 噪声残差 (高通滤波) ──');
      results.push(`  均值: ${meanResidual.toFixed(4)}`);
      results.push(`  标准差: ${stdResidual.toFixed(2)}`);
      results.push(`  最大绝对值: ${maxResidual.toFixed(2)}`);
      results.push('');

      // 3. Local variance map
      let sumLocalVar = 0;
      let localVarCount = 0;
      let maxLocalVar = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          let sum = 0;
          let sumSq = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const v = lumData[(y + dy) * width + (x + dx)];
              sum += v;
              sumSq += v * v;
              count++;
            }
          }
          const mean = sum / count;
          const lv = sumSq / count - mean * mean;
          sumLocalVar += lv;
          if (lv > maxLocalVar) maxLocalVar = lv;
          localVarCount++;
        }
      }
      const avgLocalVar = localVarCount > 0 ? sumLocalVar / localVarCount : 0;

      results.push('── 局部方差 ──');
      results.push(`  平均局部方差: ${avgLocalVar.toFixed(2)}`);
      results.push(`  最大局部方差: ${maxLocalVar.toFixed(2)}`);
      results.push('');

      // 4. Edge detection (Sobel)
      let sumEdgeMag = 0;
      let maxEdgeMag = 0;
      let edgePixelCount = 0;
      const edgeThreshold = 50;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const gx =
            -lumData[(y - 1) * width + (x - 1)] -
            2 * lumData[y * width + (x - 1)] -
            lumData[(y + 1) * width + (x - 1)] +
            lumData[(y - 1) * width + (x + 1)] +
            2 * lumData[y * width + (x + 1)] +
            lumData[(y + 1) * width + (x + 1)];

          const gy =
            -lumData[(y - 1) * width + (x - 1)] -
            2 * lumData[(y - 1) * width + x] -
            lumData[(y - 1) * width + (x + 1)] +
            lumData[(y + 1) * width + (x - 1)] +
            2 * lumData[(y + 1) * width + x] +
            lumData[(y + 1) * width + (x + 1)];

          const mag = Math.sqrt(gx * gx + gy * gy);
          sumEdgeMag += mag;
          if (mag > maxEdgeMag) maxEdgeMag = mag;
          if (mag > edgeThreshold) edgePixelCount++;
        }
      }
      const totalEdgePixels = (width - 2) * (height - 2);
      const avgEdgeMag = totalEdgePixels > 0 ? sumEdgeMag / totalEdgePixels : 0;
      const edgeRatio = totalEdgePixels > 0 ? edgePixelCount / totalEdgePixels : 0;

      results.push('── 边缘检测 (Sobel) ──');
      results.push(`  平均梯度幅值: ${avgEdgeMag.toFixed(2)}`);
      results.push(`  最大梯度幅值: ${maxEdgeMag.toFixed(2)}`);
      results.push(`  边缘像素比例: ${(edgeRatio * 100).toFixed(2)}% (阈值>${edgeThreshold})`);
      results.push('');

      // 5. LSB plane analysis
      let lsbOnes = 0;
      let lsbTransitions = 0;
      let prevLsb = -1;
      for (let i = 0; i < pixelCount; i++) {
        const lsb = lumData[i] & 1;
        if (lsb) lsbOnes++;
        if (prevLsb >= 0 && lsb !== prevLsb) lsbTransitions++;
        prevLsb = lsb;
      }
      const lsbRatio = lsbOnes / pixelCount;
      const lsbTransRate = lsbTransitions / (pixelCount - 1);

      results.push('── LSB 平面分析 ──');
      results.push(`  LSB 1 的比例: ${(lsbRatio * 100).toFixed(2)}%`);
      results.push(`  LSB 转换率: ${(lsbTransRate * 100).toFixed(2)}%`);

      // LSB pattern detection: check for repeating patterns
      let lsbPeriodicScore = 0;
      for (let period = 2; period <= 8; period++) {
        let matches = 0;
        for (let i = 0; i < pixelCount - period; i++) {
          if ((lumData[i] & 1) === (lumData[i + period] & 1)) matches++;
        }
        const matchRate = matches / (pixelCount - period);
        if (matchRate > 0.6) {
          lsbPeriodicScore++;
          results.push(`  ⚠ LSB 周期 ${period} 匹配率: ${(matchRate * 100).toFixed(1)}%`);
        }
      }
      if (lsbPeriodicScore === 0) {
        results.push('  未检测到 LSB 周期性模式');
      }

      if (lsbRatio > 0.49 && lsbRatio < 0.51 && lsbTransRate > 0.45) {
        results.push('  ⚠ LSB 分布均匀且转换率高 — 疑似随机隐写数据');
      } else if (lsbRatio > 0.47 && lsbRatio < 0.53) {
        results.push('  ? LSB 分布较均匀 — 可能有隐写');
      } else {
        results.push('  ✓ LSB 分布偏向一方 — 自然图像特征');
      }
      results.push('');

      // 6. Noise map visualization (ASCII)
      results.push('── 噪声残差图 (ASCII, 下采样) ──');
      const displayW = Math.min(MAX_DISPLAY_WIDTH, width);
      const displayH = Math.min(MAX_DISPLAY_HEIGHT, height);
      const stepX = width / displayW;
      const stepY = height / displayH;
      const normFactor = maxResidual > 0 ? 1 / maxResidual : 1;

      for (let dy = 0; dy < displayH; dy++) {
        let line = '';
        for (let dx = 0; dx < displayW; dx++) {
          const px = Math.floor(dx * stepX);
          const py = Math.floor(dy * stepY);
          const idx = py * width + px;
          const absRes = Math.abs(residual[idx]);
          const normalized = absRes * normFactor;
          const charIdx = Math.min(NOISE_CHARS.length - 1, Math.floor(normalized * NOISE_CHARS.length));
          line += NOISE_CHARS[charIdx];
        }
        results.push(`  ${line}`);
      }
      results.push(`  (字符: ${NOISE_CHARS} = 低→高噪声强度)`);
      results.push('');

      // 7. LSB map visualization
      results.push('── LSB 平面图 (ASCII, 下采样) ──');
      for (let dy = 0; dy < displayH; dy++) {
        let line = '';
        for (let dx = 0; dx < displayW; dx++) {
          const px = Math.floor(dx * stepX);
          const py = Math.floor(dy * stepY);
          const idx = py * width + px;
          const lsb = lumData[idx] & 1;
          line += lsb ? '█' : ' ';
        }
        results.push(`  ${line}`);
      }
      results.push('  (█=LSB为1, 空格=LSB为0)');
      results.push('');

      // 8. Stego likelihood assessment
      let stegoScore = 0;
      if (lsbRatio > 0.49 && lsbRatio < 0.51) stegoScore += 2;
      else if (lsbRatio > 0.47 && lsbRatio < 0.53) stegoScore += 1;
      if (lsbTransRate > 0.48) stegoScore += 2;
      else if (lsbTransRate > 0.45) stegoScore += 1;
      if (lsbPeriodicScore > 0) stegoScore += 1;
      // High noise in smooth areas (residual std in low-edge regions)
      if (stdResidual > 10 && edgeRatio < 0.05) stegoScore += 1;

      results.push('── 综合隐写评估 ──');
      results.push(`  隐写嫌疑分数: ${stegoScore}/6`);
      if (stegoScore >= 5) {
        results.push('  ⚠⚠ 高隐写嫌疑 — LSB 分布均匀且转换率高');
      } else if (stegoScore >= 3) {
        results.push('  ⚠ 中等隐写嫌疑 — LSB 行为部分异常');
      } else if (stegoScore >= 1) {
        results.push('  ? 低隐写嫌疑 — 个别指标偏离');
      } else {
        results.push('  ✓ 未检测到隐写特征');
      }
      results.push('');
      results.push('── 分析说明 ──');
      results.push('  噪声残差: 高通滤波后的大幅残差可能指示隐写区域');
      results.push('  LSB 转换率: 自然图像 LSB 转换率通常 < 40%, 随机数据 ≈ 50%');
      results.push('  局部方差: 平滑区域异常高方差可能为隐写噪声');

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
