import type { ToolDefinition } from '../../types';
export default {
  id: 'file-diff',
  name: '二进制差异比较',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['diff', 'compare', 'binary', '比较', '差异', 'diff'],
  modes: ['analyze'],
  exampleInput: '48656c6c6f\n---\n48656c6c6f20576f726c64',
} satisfies ToolDefinition;
