import type { ToolDefinition } from '../../types';

export default {
  id: 'css-format',
  name: 'CSS 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['css', '格式化', '美化', 'format', 'beautify', '样式'],
  modes: ['execute'],
  exampleInput: 'body{margin:0;padding:10px}.test{color:red;font-size:14px}',
} satisfies ToolDefinition;
