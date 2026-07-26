import type { ToolDefinition } from '../../types';
export default {
  id: 'image-size-check',
  name: '图片尺寸检查',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['size', 'dimension', 'check', '尺寸', '检查'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
