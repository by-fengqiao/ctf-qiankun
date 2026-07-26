import type { ToolDefinition } from '../../types';
export default {
  id: 'ripemd160',
  name: 'RIPEMD160',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['ripemd160', 'ripemd-160', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
