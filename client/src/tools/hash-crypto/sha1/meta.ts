import type { ToolDefinition } from '../../types';
export default {
  id: 'sha1',
  name: 'SHA1',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha1', 'sha-1', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
