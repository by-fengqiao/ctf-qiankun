import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, channelStats } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (_input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (!file) return '请拖入图片文件';
      const { canvas, ctx, imageData, width, height } = await loadImageToCanvas(file);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const grayStats = channelStats(data, 0, 4);
      return [
        `灰度化完成`,
        `图片尺寸: ${width} × ${height}`,
        `转换公式: Gray = 0.299R + 0.587G + 0.114B`,
        '',
        '── 灰度统计 ──',
        `  最小值: ${grayStats.min}`,
        `  最大值: ${grayStats.max}`,
        `  平均值: ${grayStats.avg}`,
        '',
        '灰度化结果图片:',
        dataUrl,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
