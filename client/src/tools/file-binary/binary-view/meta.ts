import type { ToolDefinition } from '../../types';
export default {
  id: 'binary-view',
  name: '二进制视图',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['binary', '二进制', '0b', 'binary view'],
  modes: ['analyze'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
