import type { ToolDefinition } from '../../types';
export default {
  id: 'qr-decoder',
  name: '二维码解码',
  description: '检测 QR 码定位图案，识别版本、格式与数据矩阵',
  category: 'stego',
  group: '图像',
  keywords: ['qr', 'code', 'decode', 'finder', 'pattern', '二维码', '解码'],
  modes: ['decode'],
  hasFileInput: true,
  exampleInput: '拖入含二维码的 PNG/JPEG 图片',
} satisfies ToolDefinition;
