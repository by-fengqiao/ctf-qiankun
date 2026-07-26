import type { ToolDefinition } from '../../types';
export default {
  id: 'rgb-channel-split',
  name: 'RGB 通道分离',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['rgb', 'channel', 'split', '通道', '分离', 'color'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'FF0000 00FF00 0000FF FFFFFF',
} satisfies ToolDefinition;
