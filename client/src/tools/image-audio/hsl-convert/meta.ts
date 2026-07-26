import type { ToolDefinition } from '../../types';
export default {
  id: 'hsl-convert',
  name: 'HSL 转换',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['hsl', 'convert', 'color', 'HSL', '转换'],
  modes: ['encode', 'decode'],
  exampleInput: '#408bd1 或 rgb(64,139,209)',
} satisfies ToolDefinition;
