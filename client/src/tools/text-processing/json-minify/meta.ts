import type { ToolDefinition } from '../../types';

export default {
  id: 'json-minify',
  name: 'JSON 压缩',
  category: 'text-processing',
  group: '格式化',
  keywords: ['json', '压缩', 'minify', 'json minify'],
  modes: ['encode'],
  exampleInput: '{\n  "name": "test",\n  "value": 123\n}',
} satisfies ToolDefinition;
