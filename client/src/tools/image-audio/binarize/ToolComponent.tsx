import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, clamp } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      { name: 'threshold', label: '阈值', type: 'text', placeholder: '0-255', default: '128' },
    ]}
    execute={async (_input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      if (!file) return '请拖入图片文件';
      const threshold = clamp(parseInt((params.threshold as string) || '128', 10), 0, 255);
      const { canvas, ctx, imageData, width, height } = await loadImageToCanvas(file);
      const data = imageData.data;
      let blackCount = 0;
      let whiteCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        const val = gray >= threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        if (val === 0) blackCount++;
        else whiteCount++;
      }
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const total = blackCount + whiteCount;
      return [
        `二值化完成`,
        `图片尺寸: ${width} × ${height}`,
        `阈值: ${threshold}`,
        '',
        `黑色像素: ${blackCount} (${((blackCount / total) * 100).toFixed(1)}%)`,
        `白色像素: ${whiteCount} (${((whiteCount / total) * 100).toFixed(1)}%)`,
        '',
        '二值化结果图片:',
        dataUrl,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
