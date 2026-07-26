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
      const { imageData, width, height } = await loadImageToCanvas(file);
      const data = imageData.data;
      const pixelCount = data.length / 4;
      const rStats = channelStats(data, 0, 4);
      const gStats = channelStats(data, 1, 4);
      const bStats = channelStats(data, 2, 4);
      const channels = [
        { name: 'R', offset: 0, stats: rStats },
        { name: 'G', offset: 1, stats: gStats },
        { name: 'B', offset: 2, stats: bStats },
      ];
      const results: string[] = [
        'RGB 通道分离',
        `像素数量: ${pixelCount}`,
        `图像尺寸: ${width} × ${height}`,
        '',
        '── 通道统计 ──',
        `  R: 范围 ${rStats.min} - ${rStats.max}, 平均 ${rStats.avg}`,
        `  G: 范围 ${gStats.min} - ${gStats.max}, 平均 ${gStats.avg}`,
        `  B: 范围 ${bStats.min} - ${bStats.max}, 平均 ${bStats.avg}`,
        '',
      ];
      for (const ch of channels) {
        const channelCanvas = document.createElement('canvas');
        channelCanvas.width = width;
        channelCanvas.height = height;
        const channelCtx = channelCanvas.getContext('2d');
        if (!channelCtx) continue;
        const channelData = channelCtx.createImageData(width, height);
        for (let i = 0; i < data.length; i += 4) {
          channelData.data[i] = ch.offset === 0 ? data[i] : 0;
          channelData.data[i + 1] = ch.offset === 1 ? data[i + 1] : 0;
          channelData.data[i + 2] = ch.offset === 2 ? data[i + 2] : 0;
          channelData.data[i + 3] = 255;
        }
        channelCtx.putImageData(channelData, 0, 0);
        const dataUrl = channelCanvas.toDataURL('image/png');
        results.push(
          `── ${ch.name} 通道图像 (其余通道置零) ──`,
          `  范围: ${ch.stats.min} - ${ch.stats.max}, 平均: ${ch.stats.avg}`,
          dataUrl,
          '',
        );
      }
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
