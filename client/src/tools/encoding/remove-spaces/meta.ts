import type { ToolDefinition } from '../../types';

export default {
  id: 'remove-spaces',
  name: '去除空格',
  category: 'encoding',
  group: '字符操作',
  keywords: ['remove spaces', 'trim', '去空格', '空白'],
  modes: ['generate'],
  exampleInput: 'Hello   World  !',
  defaultParams: { type: 'whitespace' },
} satisfies ToolDefinition;
