import type { ToolDefinition } from '../../types';
export default {
  id: 'image-stego-hints',
  name: '图片隐写提示',
  category: 'image-audio',
  group: '隐写',
  keywords: ['stego', 'hints', 'trailing', '隐写', '提示', '附加数据'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
