import type { ToolDefinition } from '../../types';
export default {
  id: 'blake2',
  name: 'BLAKE2',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['blake2', 'blake-2', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
  defaultParams: { outputLength: '256' },
} satisfies ToolDefinition;
