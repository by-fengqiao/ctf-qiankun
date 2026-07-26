import type { ToolDefinition } from '../../types';
export default {
  id: 'png-chunk',
  name: 'PNG Chunk分析',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['png', 'chunk', 'IHDR', 'IDAT', 'IEND', '图片结构', 'PNG'],
  modes: ['analyze'],
  exampleInput: '89504e470d0a1a0a0000000d49484452000000010000000108020000009077',
} satisfies ToolDefinition;
