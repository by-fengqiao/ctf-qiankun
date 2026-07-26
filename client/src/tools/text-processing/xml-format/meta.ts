import type { ToolDefinition } from '../../types';

export default {
  id: 'xml-format',
  name: 'XML 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['xml', '格式化', 'pretty print', 'xml format'],
  modes: ['encode', 'decode'],
  exampleInput: '<root><item id="1">test</item><item id="2">test2</item></root>',
} satisfies ToolDefinition;
