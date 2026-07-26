import type { ToolDefinition } from '../../types';

export default {
  id: 'binary-diff',
  name: '二进制对比',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['diff', 'binary', 'compare', '对比', '差异', 'patch'],
  modes: ['execute'],
} satisfies ToolDefinition;
