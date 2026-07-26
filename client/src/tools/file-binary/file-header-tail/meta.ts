import type { ToolDefinition } from '../../types';
export default {
  id: 'file-header-tail',
  name: '文件头尾检查',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['header', 'tail', 'footer', '文件头', '文件尾', 'header tail'],
  modes: ['analyze'],
  exampleInput: '89504e470d0a1a0a0000000d49484452000000010000000108020000009077003d48ae000000',
} satisfies ToolDefinition;
