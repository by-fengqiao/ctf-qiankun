import type { ToolDefinition } from '../../types';

export default {
  id: 'remove-newlines',
  name: '去除换行',
  category: 'encoding',
  group: '字符操作',
  keywords: ['remove newlines', 'newlines', '去换行', '换行'],
  modes: ['generate'],
  exampleInput: 'Hello\nWorld\n!',
  defaultParams: { type: 'to-space' },
} satisfies ToolDefinition;
