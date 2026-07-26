import type { ToolDefinition } from '../../types';
export default {
  id: 'fletcher32',
  name: 'Fletcher32',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['fletcher32', 'fletcher-32', 'checksum', '校验'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
