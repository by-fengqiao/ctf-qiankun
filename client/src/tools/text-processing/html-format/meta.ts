import type { ToolDefinition } from '../../types';

export default {
  id: 'html-format',
  name: 'HTML 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['html', '格式化', 'pretty print', 'html format', 'beautify'],
  modes: ['encode', 'decode'],
  exampleInput: '<div><p>Hello</p><ul><li>A</li><li>B</li></ul></div>',
} satisfies ToolDefinition;
