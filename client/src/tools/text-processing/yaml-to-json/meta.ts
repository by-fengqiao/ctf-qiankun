import type { ToolDefinition } from '../../types';

export default {
  id: 'yaml-to-json',
  name: 'YAML 转 JSON',
  category: 'text-processing',
  group: '格式化',
  keywords: ['yaml', 'json', '转换', 'yaml to json', 'yaml convert'],
  modes: ['encode', 'decode'],
  exampleInput: 'name: test\nage: 25\nitems:\n  - a\n  - b',
} satisfies ToolDefinition;
