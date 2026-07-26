import type { ToolDefinition } from '../../types';
export default {
  id: 'jpeg-analyze',
  name: 'JPEG 结构分析',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['jpeg', 'jpg', 'analyze', 'marker', 'JPEG', '分析'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 JPEG 图片',
} satisfies ToolDefinition;
