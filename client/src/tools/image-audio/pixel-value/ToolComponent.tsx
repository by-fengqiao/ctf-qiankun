import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas, clamp } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      { name: 'x', label: 'X', type: 'text', placeholder: '0', default: '0' },
      { name: 'y', label: 'Y', type: 'text', placeholder: '0', default: '0' },
    ]}
    execute={async (_input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      if (!file) return '请拖入图片文件';
      const { imageData, width, height } = await loadImageToCanvas(file);
      const x = clamp(parseInt((params.x as string) || '0', 10), 0, width - 1);
      const y = clamp(parseInt((params.y as string) || '0', 10), 0, height - 1);
      const idx = (y * width + x) * 4;
      const data = imageData.data;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      return [
        `像素坐标: (${x}, ${y})`,
        `图片尺寸: ${width} × ${height}`,
        '',
        `R: ${r}`,
        `G: ${g}`,
        `B: ${b}`,
        `A: ${a}`,
        `HEX: ${hex}`,
        `RGBA: rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
