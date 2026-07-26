import type { ToolDefinition } from '../../types';

export default {
  id: 'tap-code',
  name: '敲击码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['tap', '敲击码', 'tap code', '波利比奥斯'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
