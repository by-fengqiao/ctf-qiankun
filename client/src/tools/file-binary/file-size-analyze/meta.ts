import type { ToolDefinition } from '../../types';
export default {
  id: 'file-size-analyze',
  name: '文件大小分析',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['size', 'bytes', 'kb', 'mb', '文件大小', '分析'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
