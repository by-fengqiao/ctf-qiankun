import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, channelStats } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const UNIQUE_COLOR_LIMIT = 200000;

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (
      _input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      if (!file) return '请拖入图片文件';
      const { imageData } = await loadImageToCanvas(file);
      const data = imageData.data;
      const pixelCount = data.length / 4;
      const rStats = channelStats(data, 0, 4);
      const gStats = channelStats(data, 1, 4);
      const bStats = channelStats(data, 2, 4);
      const avgColor = `#${toHex(Number(rStats.avg))}${toHex(Number(gStats.avg))}${toHex(
        Number(bStats.avg),
      )}`.toUpperCase();
      const results: string[] = [
        '图像色彩统计',
        `像素数量: ${pixelCount}`,
        `图像尺寸: ${imageData.width} × ${imageData.height}`,
        `平均颜色: ${avgColor}`,
        '',
        '── 通道统计 ──',
        `  R: 范围 ${rStats.min} - ${rStats.max}, 平均 ${rStats.avg}`,
        `  G: 范围 ${gStats.min} - ${gStats.max}, 平均 ${gStats.avg}`,
        `  B: 范围 ${bStats.min} - ${bStats.max}, 平均 ${bStats.avg}`,
      ];
      if (pixelCount <= UNIQUE_COLOR_LIMIT) {
        const colorMap = new Map<string, number>();
        for (let i = 0; i < data.length; i += 4) {
          const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`.toUpperCase();
          colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
        }
        results.push(
          `唯一颜色数: ${colorMap.size}`,
          '',
          '── 前 10 主色调 ──',
        );
        const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
        const showCount = Math.min(sorted.length, 10);
        for (let i = 0; i < showCount; i++) {
          const [color, count] = sorted[i];
          results.push(`  ${color}: ${count} 次 (${((count / pixelCount) * 100).toFixed(1)}%)`);
        }
      } else {
        results.push(
          `唯一颜色数: N/A (图像过大，像素数超过 ${UNIQUE_COLOR_LIMIT}，已跳过唯一颜色统计)`,
        );
      }
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
