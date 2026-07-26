import AsyncTool from '../../_shared/AsyncTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (_input: string, _mode: string, params: Record<string, unknown>, file: File | null) => {
      const x = parseInt((params.x as string) || '0', 10);
      const y = parseInt((params.y as string) || '0', 10);
      const width = parseInt((params.width as string) || '100', 10);
      const height = parseInt((params.height as string) || '100', 10);
      if (!file) {
        return [
          '图片裁剪参数:',
          `  X: ${x}`,
          `  Y: ${y}`,
          `  宽度: ${width}`,
          `  高度: ${height}`,
          '',
          '请拖入图片文件进行裁剪',
        ].join('\n');
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, bitmap.width - x);
        canvas.height = Math.min(height, bitmap.height - y);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 不可用');
        ctx.drawImage(bitmap, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        return [
          `原始图片: ${file.name} (${bitmap.width}×${bitmap.height})`,
          `裁剪区域: (${x}, ${y}) → (${x + canvas.width}, ${y + canvas.height})`,
          `裁剪后尺寸: ${canvas.width}×${canvas.height}`,
          '',
          '裁剪结果图片:',
          dataUrl,
        ].join('\n');
      } catch (e) {
        throw new Error(`图片裁剪失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    }}
    paramsConfig={[
      { name: 'x', label: '起始 X', type: 'text', default: '0' },
      { name: 'y', label: '起始 Y', type: 'text', default: '0' },
      { name: 'width', label: '裁剪宽度', type: 'text', default: '100' },
      { name: 'height', label: '裁剪高度', type: 'text', default: '100' },
    ]}
  />
);
export default ToolComponent;
