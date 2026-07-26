import type { ToolDefinition } from '../../types';

export default {
  id: 'line-numbers',
  name: '行号添加',
  category: 'text-processing',
  group: '操作',
  keywords: ['行号', '添加行号', 'line numbers', 'numbering'],
  modes: ['encode', 'decode'],
  exampleInput: 'first line\nsecond line\nthird line',
} satisfies ToolDefinition;
