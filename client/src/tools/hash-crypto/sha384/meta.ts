import type { ToolDefinition } from '../../types';
export default {
  id: 'sha384',
  name: 'SHA384',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha384', 'sha-384', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
