import type { ToolDefinition } from '../../types';

export default {
  id: 'fractionated-morse',
  name: '分馏摩斯密码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['fractionated', 'morse', '分馏', 'fractionated morse'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
  defaultParams: { key: 'KEYWORD' },
} satisfies ToolDefinition;
