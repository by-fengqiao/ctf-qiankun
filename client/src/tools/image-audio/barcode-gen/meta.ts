import type { ToolDefinition } from '../../types';
export default {
  id: 'barcode-gen',
  name: '条形码生成',
  category: 'image-audio',
  group: '编码图',
  keywords: ['barcode', 'code39', 'generate', '条形码', '生成'],
  modes: ['generate', 'decode'],
  exampleInput: 'HELLO123',
} satisfies ToolDefinition;
