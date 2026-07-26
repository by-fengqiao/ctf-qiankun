import type { ToolDefinition } from '../../types';

export default {
  id: 'sql-escape',
  name: 'SQL 转义',
  category: 'web-network',
  group: '其他',
  keywords: ['sql', 'escape', 'unescape', '转义', 'inject', '注入'],
  modes: ['encode', 'decode'],
  exampleInput: "It's a test\\string",
} satisfies ToolDefinition;
