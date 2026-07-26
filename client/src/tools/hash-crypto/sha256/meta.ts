import type { ToolDefinition } from '../../types';
export default {
  id: 'sha256',
  name: 'SHA256',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha256', 'sha-256', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
