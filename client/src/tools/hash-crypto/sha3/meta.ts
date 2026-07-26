import type { ToolDefinition } from '../../types';
export default {
  id: 'sha3',
  name: 'SHA3',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha3', 'sha-3', 'keccak', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
  defaultParams: { outputLength: '256' },
} satisfies ToolDefinition;
