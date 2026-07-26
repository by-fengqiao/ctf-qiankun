import type { ToolDefinition } from '../../types';
export default {
  id: 'md5',
  name: 'MD5',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['md5', 'hash', '摘要'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
