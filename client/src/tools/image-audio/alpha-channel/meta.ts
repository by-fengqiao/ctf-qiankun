import type { ToolDefinition } from '../../types';
export default {
  id: 'alpha-channel',
  name: 'Alpha 通道分析',
  category: 'image-audio',
  group: '隐写',
  keywords: ['alpha', 'transparency', '透明', '通道', 'RGBA'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'FF0000FF 00FF0080 0000FF00',
} satisfies ToolDefinition;
