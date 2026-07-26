import type { ToolDefinition } from '../../types';
export default {
  id: 'hsv-convert',
  name: 'HSV 转换',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['hsv', 'hsb', 'convert', 'color', 'HSV', '转换'],
  modes: ['encode', 'decode'],
  exampleInput: '#408bd1 或 rgb(64,139,209)',
} satisfies ToolDefinition;
