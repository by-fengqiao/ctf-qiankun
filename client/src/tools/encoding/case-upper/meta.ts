import type { ToolDefinition } from '../../types';

export default {
  id: 'case-upper',
  name: '大写转换',
  category: 'encoding',
  group: '文本变换',
  keywords: ['uppercase', 'upper', '大写', '转换'],
  modes: ['generate'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
