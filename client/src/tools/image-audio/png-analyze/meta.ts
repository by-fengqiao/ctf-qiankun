import type { ToolDefinition } from '../../types';
export default {
  id: 'png-analyze',
  name: 'PNG 结构分析',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['png', 'analyze', 'chunk', 'structure', 'PNG', '分析'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 PNG 图片',
} satisfies ToolDefinition;
