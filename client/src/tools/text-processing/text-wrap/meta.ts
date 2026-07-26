import type { ToolDefinition } from '../../types';

export default {
  id: 'text-wrap',
  name: '文本换行',
  category: 'text-processing',
  group: '操作',
  keywords: ['换行', '文本换行', 'text wrap', '折行'],
  modes: ['encode'],
  exampleInput: 'This is a long line of text that needs to be wrapped at a certain width.',
} satisfies ToolDefinition;
