import type { ToolDefinition } from '../../types';

export default {
  id: 'case-swap',
  name: '大小写互换',
  category: 'encoding',
  group: '文本变换',
  keywords: ['swap case', 'swap', '大小写互换', '转换'],
  modes: ['generate'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
