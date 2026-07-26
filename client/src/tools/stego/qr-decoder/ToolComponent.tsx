import AsyncTool from '../../_shared/AsyncTool';
import { decodeImage } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

interface FinderPattern {
  x: number;
  y: number;
  score: number;
}

const MIN_MODULE = 3;
const MAX_MODULE = 30;
const SAMPLE_STEP = 2;

/** Check if a region matches the 1:1:3:1:1 finder pattern ratio. */
function checkFinderRatio(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  moduleSize: number,
): number {
  // Horizontal scan
  const hRatios = scanDirection(pixels, width, height, cx, cy, moduleSize, 1, 0);
  if (!hRatios) return 0;

  // Vertical scan
  const vRatios = scanDirection(pixels, width, height, cx, cy, moduleSize, 0, 1);
  if (!vRatios) return 0;

  // Check ratios: 1:1:3:1:1
  const expected = [1, 1, 3, 1, 1];
  const total = hRatios.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const unit = total / 7;

  let hScore = 0;
  let vScore = 0;
  for (let i = 0; i < 5; i++) {
    const hDiff = Math.abs(hRatios[i] - expected[i] * unit);
    const vDiff = Math.abs(vRatios[i] - expected[i] * unit);
    hScore += hDiff;
    vScore += vDiff;
  }
  const tolerance = unit * 0.5;
  if (hScore > tolerance * 5 || vScore > tolerance * 5) return 0;

  return 1 - (hScore + vScore) / (tolerance * 10);
}

function scanDirection(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  moduleSize: number,
  dx: number,
  dy: number,
): number[] | null {
  const totalModules = moduleSize * 7;
  const halfLen = Math.floor(totalModules / 2);
  const ratios = [0, 0, 0, 0, 0];
  // Expected pattern: dark, light, dark, light, dark (from center outward)
  // Center is dark (index 2)
  let idx = 2;
  let prevDark = -1;

  // Scan right/down from center
  for (let d = 0; d <= halfLen; d += SAMPLE_STEP) {
    const px = cx + dx * d;
    const py = cy + dy * d;
    if (px < 0 || px >= width || py < 0 || py >= height) return null;
    const pixelIdx = (py * width + px) * 4;
    const lum = (pixels[pixelIdx] + pixels[pixelIdx + 1] + pixels[pixelIdx + 2]) / 3;
    const isDark = lum < 128;
    if (prevDark === -1) {
      prevDark = isDark ? 1 : 0;
    }
    if (isDark !== (prevDark === 1)) {
      idx = Math.max(0, idx - 1);
    }
    if (idx >= 0 && idx < 5) {
      ratios[idx] += SAMPLE_STEP;
    }
    prevDark = isDark ? 1 : 0;
    if (idx === 0) break;
  }

  // Reset and scan left/up from center
  idx = 2;
  prevDark = -1;
  for (let d = SAMPLE_STEP; d <= halfLen; d += SAMPLE_STEP) {
    const px = cx - dx * d;
    const py = cy - dy * d;
    if (px < 0 || px >= width || py < 0 || py >= height) return null;
    const pixelIdx = (py * width + px) * 4;
    const lum = (pixels[pixelIdx] + pixels[pixelIdx + 1] + pixels[pixelIdx + 2]) / 3;
    const isDark = lum < 128;
    if (prevDark === -1) {
      prevDark = isDark ? 1 : 0;
    }
    if (isDark !== (prevDark === 1)) {
      idx = Math.min(4, idx + 1);
    }
    if (idx >= 0 && idx < 5) {
      ratios[idx] += SAMPLE_STEP;
    }
    prevDark = isDark ? 1 : 0;
    if (idx === 4) break;
  }

  return ratios;
}

/** QR version → size lookup (modules per side). */
function getQrVersion(modules: number): number {
  if (modules < 21) return 0;
  const version = (modules - 21) / 4 + 1;
  if (version !== Math.floor(version) || version < 1 || version > 40) return 0;
  return version;
}

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="二维码解码"
    execute={async (
      _input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      if (!file) return '请拖入含二维码的 PNG/JPEG 图片文件';
      const { width, height, pixels } = await decodeImage(file, '');
      if (width < 21 || height < 21) {
        return `图片太小 (${width}×${height})，无法包含有效二维码`;
      }

      const results: string[] = [
        '二维码 (QR Code) 解析',
        `图片尺寸: ${width}×${height} px`,
        `总像素数: ${width * height}`,
        '',
      ];

      // Estimate module size: sample center area
      // Look for dark/light transitions
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);

      // Find module size by scanning a horizontal line through center
      let transitionCount = 0;
      let firstDark = -1;
      let lastDark = -1;
      let prevDark = false;
      for (let x = 0; x < width; x += SAMPLE_STEP) {
        const idx = (cy * width + x) * 4;
        const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        const isDark = lum < 128;
        if (x === 0) prevDark = isDark;
        if (isDark !== prevDark) transitionCount++;
        if (isDark) {
          if (firstDark < 0) firstDark = x;
          lastDark = x;
        }
        prevDark = isDark;
      }

      results.push('── 图像分析 ──');
      results.push(`  中心行水平过渡: ${transitionCount}`);
      results.push(`  首个暗像素: x=${firstDark}`);
      results.push(`  末个暗像素: x=${lastDark}`);
      if (firstDark >= 0 && lastDark > firstDark) {
        results.push(`  QR 宽度估计: ${lastDark - firstDark} px`);
      }

      // Try multiple module sizes to find finder patterns
      const finderPatterns: FinderPattern[] = [];

      for (let ms = MIN_MODULE; ms <= MAX_MODULE; ms++) {
        const step = ms * 3; // Sample at center of each finder
        const candidates: FinderPattern[] = [];

        // Search in a grid pattern
        for (let y = step; y < height - step; y += Math.max(1, Math.floor(ms * 2))) {
          for (let x = step; x < width - step; x += Math.max(1, Math.floor(ms * 2))) {
            const score = checkFinderRatio(pixels, width, height, x, y, ms);
            if (score > 0.5) {
              // Check if too close to an existing candidate
              const tooClose = candidates.some(
                (c) => Math.abs(c.x - x) < ms * 4 && Math.abs(c.y - y) < ms * 4,
              );
              if (!tooClose) {
                candidates.push({ x, y, score });
              }
            }
          }
        }

        if (candidates.length >= 3) {
          // Sort by score
          candidates.sort((a, b) => b.score - a.score);
          finderPatterns.push(...candidates);
          results.push(`  模块大小 ${ms} px: 找到 ${candidates.length} 个候选定位图案`);
          break;
        }
      }

      results.push('', '── 定位图案检测 ──');
      if (finderPatterns.length < 3) {
        results.push(`  ⚠ 仅找到 ${finderPatterns.length} 个候选定位图案 (需 ≥3)`);
        results.push('  可能原因: 图片不含 QR 码 / 模块太小 / 图像质量差');
        // Still output what we found
        for (const fp of finderPatterns.slice(0, 5)) {
          results.push(`  候选: (${fp.x}, ${fp.y}) 置信度: ${fp.score.toFixed(2)}`);
        }
      } else {
        // Sort by position: top-left, top-right, bottom-left
        const sorted = [...finderPatterns].sort((a, b) => a.y - b.y || a.x - b.x);
        const topLeft = sorted[0];
        // Find top-right (similar y, max x)
        const topRight = sorted
          .filter((f) => Math.abs(f.y - topLeft.y) < 20)
          .sort((a, b) => b.x - a.x)[0];
        // Find bottom-left (similar x to topLeft, max y)
        const bottomLeft = sorted
          .filter((f) => Math.abs(f.x - topLeft.x) < 20)
          .sort((a, b) => b.y - a.y)[0];

        results.push(`  ✓ 检测到 ${finderPatterns.length} 个定位图案`);
        if (topLeft) results.push(`  左上: (${topLeft.x}, ${topLeft.y}) 置信度: ${topLeft.score.toFixed(2)}`);
        if (topRight) results.push(`  右上: (${topRight.x}, ${topRight.y}) 置信度: ${topRight.score.toFixed(2)}`);
        if (bottomLeft) results.push(`  左下: (${bottomLeft.x}, ${bottomLeft.y}) 置信度: ${bottomLeft.score.toFixed(2)}`);

        // Estimate module size
        if (topLeft && topRight && bottomLeft) {
          const hDist = Math.abs(topRight.x - topLeft.x);
          const vDist = Math.abs(bottomLeft.y - topLeft.y);
          const moduleSize = (hDist + vDist) / 2;

          results.push('', '── 尺寸估算 ──');
          results.push(`  水平距离: ${hDist} px`);
          results.push(`  垂直距离: ${vDist} px`);
          results.push(`  估算模块大小: ${moduleSize.toFixed(1)} px`);

          // QR version estimation
          // QR modules = 17 + 4*version + finder patterns (7 each side)
          // Total width in modules ≈ hDist / moduleSize + 14 (finder patterns + separators)
          const modulesInWidth = Math.round(hDist / moduleSize) + 14;
          const version = getQrVersion(modulesInWidth);

          results.push(`  估算总模块数: ${modulesInWidth}×${modulesInWidth}`);
          if (version > 0) {
            results.push(`  估算版本: ${version} (${21 + 4 * (version - 1)}×${21 + 4 * (version - 1)} 模块)`);
            results.push(`  数据容量: ${getDataCapacity(version)} 字节 (约)`);
          } else {
            results.push(`  版本估算失败 (模块数 ${modulesInWidth} 不符合标准 QR)`);
          }

          // Extract raw module matrix (downsampled)
          results.push('', '── 原始数据矩阵 (采样) ──');
          const sampleModules = Math.min(modulesInWidth, 40);
          const matrixLines: string[] = [];
          for (let my = 0; my < sampleModules; my++) {
            let line = '';
            const py = topLeft.y + Math.round((my / sampleModules) * vDist);
            for (let mx = 0; mx < sampleModules; mx++) {
              const px = topLeft.x + Math.round((mx / sampleModules) * hDist);
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                line += lum < 128 ? '█' : ' ';
              } else {
                line += '?';
              }
            }
            matrixLines.push(line);
          }
          results.push('  (█=暗模块, 空格=亮模块)');
          results.push(...matrixLines.map((l) => `  ${l}`));

          // Detect format info
          results.push('', '── 格式信息 ──');
          // Format info is near top-left finder pattern
          if (moduleSize >= 3) {
            const formatArea = extractFormatInfo(pixels, width, height, topLeft, moduleSize);
            if (formatArea) {
              results.push(`  原始格式比特: ${formatArea}`);
              results.push(`  (需掩码解码才能获得纠错等级与掩码模式)`);
            } else {
              results.push('  ⚠ 无法提取格式信息');
            }
          }
        }
      }

      results.push('', '── 说明 ──');
      results.push('  本工具检测 QR 码定位图案并估算版本/尺寸');
      results.push('  完整解码需实现 Reed-Solomon 纠错与数据解码');
      results.push('  对于精确解码建议使用专用 QR 解码库');

      return results.join('\n');
    }}
  />
);

function getDataCapacity(version: number): number {
  // Approximate data capacity for version-level QR (byte mode, L error correction)
  const capacities = [
    17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
    321, 367, 425, 458, 504, 560, 624, 666, 711, 779,
    857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538,
    1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331, 2463, 2591,
  ];
  if (version >= 1 && version <= 40) return capacities[version - 1];
  return 0;
}

function extractFormatInfo(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  topLeft: FinderPattern,
  moduleSize: number,
): string | null {
  // Format info bits 0-14 are around top-left finder
  // Bits 0-5: below finder, bits 6-8: right of finder, bits 7-8: also above bottom-left
  const bits: string[] = [];
  // Scan horizontal strip just below top-left finder
  for (let i = 0; i < 8; i++) {
    const px = topLeft.x + Math.round((i + 8) * moduleSize);
    const py = topLeft.y;
    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = (py * width + px) * 4;
      const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      bits.push(lum < 128 ? '1' : '0');
    }
  }
  return bits.length > 0 ? bits.join('') : null;
}

export default ToolComponent;
