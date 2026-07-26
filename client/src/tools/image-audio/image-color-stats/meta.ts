import type { ToolDefinition } from '../../types';
export default {
  id: 'image-color-stats',
  name: '图像色彩统计',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['color', 'stats', 'unique', 'dominant', '色彩统计', '主色调'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'FF0000 00FF00 0000FF FF0000',
} satisfies ToolDefinition;
