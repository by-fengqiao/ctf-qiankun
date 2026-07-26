import type { ToolDefinition } from '../../types';

export default {
  id: 'sql-format',
  name: 'SQL 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['sql', '格式化', 'pretty print', 'sql format', 'beautify'],
  modes: ['encode'],
  exampleInput: 'SELECT id,name,email FROM users WHERE age>18 ORDER BY name DESC LIMIT 10',
} satisfies ToolDefinition;
