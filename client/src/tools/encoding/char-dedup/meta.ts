import type { ToolDefinition } from '../../types';

export default {
  id: 'char-dedup',
  name: '字符去重',
  category: 'encoding',
  group: '字符操作',
  keywords: ['dedup', 'deduplicate', '去重', '唯一', 'unique'],
  modes: ['generate'],
  exampleInput: 'aabbccdd',
} satisfies ToolDefinition;
