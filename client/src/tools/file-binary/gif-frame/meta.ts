import type { ToolDefinition } from '../../types';
export default {
  id: 'gif-frame',
  name: 'GIF帧信息',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['gif', 'frame', 'header', 'GIF', '帧', '动画'],
  modes: ['analyze'],
  exampleInput: '47494638396101000100800000000000ffffff21f90401000000002c',
} satisfies ToolDefinition;
