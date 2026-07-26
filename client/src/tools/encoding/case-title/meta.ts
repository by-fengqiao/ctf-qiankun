import type { ToolDefinition } from '../../types';

export default {
  id: 'case-title',
  name: '标题格式',
  category: 'encoding',
  group: '文本变换',
  keywords: ['title case', 'title', '标题格式', '首字母大写', '转换'],
  modes: ['generate'],
  exampleInput: 'hello world',
} satisfies ToolDefinition;
