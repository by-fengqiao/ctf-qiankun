import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      {
        name: 'format',
        label: '格式',
        type: 'select',
        default: 'png',
        options: [
          { value: 'png', label: 'PNG' },
          { value: 'jpeg', label: 'JPEG' },
          { value: 'webp', label: 'WebP' },
          { value: 'bmp', label: 'BMP' },
        ],
      },
    ]}
    execute={async (input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      const format = (params.format as string) || 'png';
      const mime = MIME_MAP[format] ?? 'image/png';
      if (file) {
        const { canvas, width, height } = await loadImageToCanvas(file);
        const quality = format === 'jpeg' ? 0.9 : undefined;
        const dataUrl = canvas.toDataURL(mime, quality);
        return [
          '图片格式转换',
          `原始文件: ${file.name}`,
          `原始类型: ${file.type}`,
          `原始大小: ${file.size} 字节`,
          `图片尺寸: ${width} × ${height}`,
          `目标格式: ${format.toUpperCase()}`,
          `转换后大小: ${dataUrl.length} 字符`,
          '',
          `转换后图片:`,
          dataUrl,
        ].join('\n');
      }
      if (!input) return '请拖入图片文件进行格式转换';
      return [
        '图片格式转换说明',
        `目标格式: ${format.toUpperCase()}`,
        '',
        '请拖入图片文件以执行实际转换',
        '',
        `转换到 ${format.toUpperCase()}:`,
        format === 'png' ? '  无损压缩，支持透明通道' : '',
        format === 'jpeg' ? '  有损压缩，不支持透明通道，体积小' : '',
        format === 'webp' ? '  现代格式，支持透明，高压缩比' : '',
        format === 'bmp' ? '  无压缩位图，体积大' : '',
      ].filter(Boolean).join('\n');
    }}
  />
);

export default ToolComponent;
