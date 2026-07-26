import type { ToolDefinition } from '../../types';

export default {
  id: 'trim-lines',
  name: '行首尾去空',
  category: 'text-processing',
  group: '操作',
  keywords: ['去空格', 'trim', '行首尾', '去除空白'],
  modes: ['encode'],
  exampleInput: '  hello  \n  world  \n  trim me  ',
} satisfies ToolDefinition;
