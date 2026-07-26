import type { ToolDefinition } from '../../types';

export default {
  id: 'braille',
  name: '盲文编码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['braille', '盲文', '点字'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
