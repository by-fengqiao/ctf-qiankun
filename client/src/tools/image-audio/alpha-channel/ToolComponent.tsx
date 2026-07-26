import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, channelStats } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

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
      const stats = channelStats(data, 3, 4);
      let fullOp = 0;
      let semiOp = 0;
      let fullTrans = 0;
      for (let i = 3; i < data.length; i += 4) {
        const a = data[i];
        if (a === 0) fullTrans++;
        else if (a === 255) fullOp++;
        else semiOp++;
      }
      const results: string[] = [
        'Alpha 通道分析',
        `像素数量: ${pixelCount}`,
        `数据格式: RGBA (4 字节/像素)`,
        '',
        '── Alpha 分布 ──',
        `  最小值: ${stats.min}`,
        `  最大值: ${stats.max}`,
        `  平均值: ${stats.avg}`,
        `  完全透明 (α=0): ${fullTrans} (${((fullTrans / pixelCount) * 100).toFixed(1)}%)`,
        `  半透明 (0<α<255): ${semiOp} (${((semiOp / pixelCount) * 100).toFixed(1)}%)`,
        `  完全不透明 (α=255): ${fullOp} (${((fullOp / pixelCount) * 100).toFixed(1)}%)`,
      ];
      if (semiOp > 0) {
        results.push('', '⚠ 检测到半透明像素，可能包含透明度信息');
      }
      if (fullTrans > pixelCount * 0.5) {
        results.push('⚠ 超过 50% 像素完全透明');
      }
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
