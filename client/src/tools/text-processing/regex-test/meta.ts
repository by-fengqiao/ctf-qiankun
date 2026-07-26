import type { ToolDefinition } from '../../types';

export default {
  id: 'regex-test',
  name: '正则测试',
  category: 'text-processing',
  group: '生成',
  keywords: ['正则', 'regex', '正则表达式', '匹配', 'match', 'pattern'],
  modes: ['analyze'],
  exampleInput: 'Hello World 123\nFoo Bar 456',
} satisfies ToolDefinition;
