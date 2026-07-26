import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, channelStats } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      {
        name: 'channel',
        label: '通道',
        type: 'select',
        default: 'R',
        options: [
          { value: 'R', label: 'R (红)' },
          { value: 'G', label: 'G (绿)' },
          { value: 'B', label: 'B (蓝)' },
          { value: 'A', label: 'A (Alpha)' },
        ],
      },
    ]}
    execute={async (_input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      if (!file) return '请拖入图片文件';
      const channel = (params.channel as string) || 'R';
      const channelMap: Record<string, number> = { R: 0, G: 1, B: 2, A: 3 };
      const offset = channelMap[channel] ?? 0;
      const { canvas, ctx, imageData, width, height } = await loadImageToCanvas(file);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i + offset];
        data[i] = offset === 0 ? val : 0;
        data[i + 1] = offset === 1 ? val : 0;
        data[i + 2] = offset === 2 ? val : 0;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const stats = channelStats(imageData.data, offset, 4);
      return [
        `颜色平面提取: ${channel} 通道`,
        `图片尺寸: ${width} × ${height}`,
        '',
        '── 统计 ──',
        `  最小值: ${stats.min}`,
        `  最大值: ${stats.max}`,
        `  平均值: ${stats.avg}`,
        '',
        '颜色平面提取结果:',
        dataUrl,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
