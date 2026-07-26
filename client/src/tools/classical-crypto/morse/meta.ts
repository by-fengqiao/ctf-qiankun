import type { ToolDefinition } from '../../types';

export default {
  id: 'morse',
  name: '摩斯密码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['morse', '摩斯', '电报', 'telegraph'],
  modes: ['encode', 'decode'],
  exampleInput: 'SOS',
} satisfies ToolDefinition;
