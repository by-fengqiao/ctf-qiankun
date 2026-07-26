import type { ToolDefinition } from '../../types';

export default {
  id: 'json-to-csv',
  name: 'JSON 转 CSV',
  category: 'text-processing',
  group: '转换',
  keywords: ['json', 'csv', '转换', 'convert', 'json to csv', '导出'],
  modes: ['execute'],
  exampleInput: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
} satisfies ToolDefinition;
