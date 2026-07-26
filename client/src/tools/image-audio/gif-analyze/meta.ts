import type { ToolDefinition } from '../../types';
export default {
  id: 'gif-analyze',
  name: 'GIF 结构分析',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['gif', 'analyze', 'frame', 'GIF', '分析'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 GIF 图片',
} satisfies ToolDefinition;
