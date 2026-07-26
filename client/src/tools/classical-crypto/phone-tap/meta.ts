import type { ToolDefinition } from '../../types';

export default {
  id: 'phone-tap',
  name: '手机多频输入',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['phone', 'tap', '手机键盘', 'multi-tap', 'T9'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
