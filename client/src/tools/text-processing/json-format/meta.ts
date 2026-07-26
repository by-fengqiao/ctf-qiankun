import type { ToolDefinition } from '../../types';

export default {
  id: 'json-format',
  name: 'JSON 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['json', '格式化', 'pretty print', 'json format'],
  modes: ['encode'],
  exampleInput: '{"name":"test","value":123,"items":[1,2,3]}',
} satisfies ToolDefinition;
