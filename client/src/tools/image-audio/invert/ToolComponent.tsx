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
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const r = channelStats(data, 0, 4);
      const g = channelStats(data, 1, 4);
      const b = channelStats(data, 2, 4);
      return [
        `颜色反转完成`,
        `图片尺寸: ${width} × ${height}`,
        `转换公式: R'=255-R, G'=255-G, B'=255-B`,
        '',
        '── 反转后统计 ──',
        `  R: min=${r.min}  max=${r.max}  avg=${r.avg}`,
        `  G: min=${g.min}  max=${g.max}  avg=${g.avg}`,
        `  B: min=${b.min}  max=${b.max}  avg=${b.avg}`,
        '',
        '反转结果图片:',
        dataUrl,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
