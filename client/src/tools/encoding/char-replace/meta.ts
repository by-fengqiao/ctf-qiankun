import type { ToolDefinition } from '../../types';

export default {
  id: 'char-replace',
  name: '字符替换',
  category: 'encoding',
  group: '字符操作',
  keywords: ['replace', 'substitute', '替换', '字符替换'],
  modes: ['generate'],
  exampleInput: 'Hello World',
  defaultParams: { find: 'o', replace: '0' },
} satisfies ToolDefinition;
