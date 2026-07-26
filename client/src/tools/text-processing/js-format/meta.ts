import type { ToolDefinition } from '../../types';

export default {
  id: 'js-format',
  name: 'JS 格式化',
  category: 'text-processing',
  group: '格式化',
  keywords: ['javascript', 'js', '格式化', '美化', 'format', 'beautify'],
  modes: ['execute'],
  exampleInput: 'function test(){var x=1;if(x){console.log(x);}}',
} satisfies ToolDefinition;
