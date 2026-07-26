import type { ToolDefinition } from '../../types';
export default {
  id: 'qr-code-gen',
  name: '二维码生成',
  category: 'image-audio',
  group: '编码图',
  keywords: ['qr', 'qrcode', 'generate', '二维码', '生成'],
  modes: ['generate'],
  exampleInput: 'https://example.com',
} satisfies ToolDefinition;
