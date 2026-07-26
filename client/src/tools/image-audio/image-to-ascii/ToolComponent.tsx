import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const CHARSETS: Record<string, string> = {
  standard: '@%#*+=-:. ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\'. ',
  blocks: '█▓▒░ ',
};

const hexToBytes = (input: string): Uint8Array => {
  const cleaned = input.replace(/[\s:,-]/g, '').replace(/0x/gi, '');
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) return new Uint8Array(0);
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return new Uint8Array(0);
  const result = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    result[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return result;
};

const renderAscii = (imageData: ImageData, width: number, height: number, params: Record<string, unknown>): string => {
  const targetWidth = Math.max(1, Math.min(200, parseInt((params.width as string) || '80', 10)));
  const charsetName = (params.charset as string) || 'standard';
  const chars = CHARSETS[charsetName] ?? CHARSETS.standard;
  const cols = Math.min(targetWidth, width);
  const rows = Math.max(1, Math.floor(((cols / width) * height) / 2));
  const results: string[] = [
    `ASCII 字符画 (尺寸: ${cols}×${rows})`,
    `像素数: ${width * height}, 字符集: ${charsetName}`,
    '',
  ];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const srcX = Math.floor((x / cols) * width);
      const srcY = Math.floor((y / rows) * height);
      const idx = (srcY * width + srcX) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
      const charIdx = Math.floor((gray / 255) * (chars.length - 1));
      line += chars[chars.length - 1 - charIdx];
    }
    results.push(line);
  }
  return results.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      { name: 'width', label: '输出宽度', type: 'text', placeholder: '字符数', default: '80' },
      {
        name: 'charset',
        label: '字符集',
        type: 'select',
        default: 'standard',
        options: [
          { value: 'standard', label: '标准 (@%#*+=-)' },
          { value: 'detailed', label: '详细 (高对比)' },
          { value: 'blocks', label: '色块 (█▓▒░)' },
        ],
      },
    ]}
    execute={async (
      input: string,
      _mode: string,
      params: Record<string, unknown>,
      file?: File | null,
    ) => {
      let sourceFile = file;
      if (!sourceFile && input) {
        const bytes = hexToBytes(input);
        if (bytes.length > 0) {
          const buffer = new Uint8Array(bytes).buffer;
          sourceFile = new File([buffer], 'image', { type: 'application/octet-stream' });
        }
      }
      if (!sourceFile) return '请拖入图片文件或输入图片十六进制数据';
      const { imageData, width, height } = await loadImageToCanvas(sourceFile);
      return renderAscii(imageData, width, height, params);
    }}
  />
);
export default ToolComponent;
