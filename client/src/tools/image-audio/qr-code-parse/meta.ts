import type { ToolDefinition } from '../../types';
export default {
  id: 'qr-code-parse',
  name: '二维码解析',
  category: 'image-audio',
  group: '编码图',
  keywords: ['qr', 'qrcode', 'parse', 'decode', '二维码', '解析'],
  modes: ['analyze'],
  exampleInput: 'https://example.com',
} satisfies ToolDefinition;
