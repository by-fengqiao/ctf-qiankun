import type { ToolDefinition } from '../../types';
export default {
  id: 'color-plane-view',
  name: '色彩平面分析',
  category: 'image-audio',
  group: '隐写',
  keywords: ['color', 'plane', 'channel', 'bit', '色彩平面', '位平面'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'FF00AA 123456',
} satisfies ToolDefinition;
