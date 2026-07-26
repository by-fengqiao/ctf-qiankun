import type { ToolDefinition } from '../../types';
export default {
  id: 'sha512',
  name: 'SHA512',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha512', 'sha-512', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
