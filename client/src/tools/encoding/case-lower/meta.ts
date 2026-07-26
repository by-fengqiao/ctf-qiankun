import type { ToolDefinition } from '../../types';

export default {
  id: 'case-lower',
  name: '小写转换',
  category: 'encoding',
  group: '文本变换',
  keywords: ['lowercase', 'lower', '小写', '转换'],
  modes: ['generate'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
