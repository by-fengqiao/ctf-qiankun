import type { ToolDefinition } from '../../types';

export default {
  id: 'data-uri',
  name: 'Data URI',
  category: 'encoding',
  group: '其他',
  keywords: ['data', 'uri', 'data-uri', 'data uri', '数据URI'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
