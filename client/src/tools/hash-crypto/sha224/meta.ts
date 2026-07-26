import type { ToolDefinition } from '../../types';
export default {
  id: 'sha224',
  name: 'SHA224',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['sha224', 'sha-224', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
