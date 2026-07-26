import type { ToolDefinition } from '../../types';
export default {
  id: 'keccak',
  name: 'Keccak',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['keccak', 'sha3', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
  defaultParams: { outputLength: '256' },
} satisfies ToolDefinition;
