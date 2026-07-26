import type { ToolDefinition } from '../../types';

export default {
  id: 'csv-to-json',
  name: 'CSV 转 JSON',
  category: 'text-processing',
  group: '转换',
  keywords: ['csv', 'json', '转换', 'csv to json', 'csv convert'],
  modes: ['encode'],
  exampleInput: 'name,age,city\nAlice,30,Beijing\nBob,25,Shanghai',
} satisfies ToolDefinition;
