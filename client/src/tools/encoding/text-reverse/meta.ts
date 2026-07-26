import type { ToolDefinition } from '../../types';

export default {
  id: 'text-reverse',
  name: '文本反转',
  category: 'encoding',
  group: '文本变换',
  keywords: ['reverse', '反转', '倒序', '逆序'],
  modes: ['generate'],
  exampleInput: 'Hello World\nLine 2',
  defaultParams: { type: 'char' },
} satisfies ToolDefinition;
