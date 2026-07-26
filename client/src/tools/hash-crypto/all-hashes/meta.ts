import type { ToolDefinition } from '../../types';
export default {
  id: 'all-hashes',
  name: 'All Hashes',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['hash', 'all', '全部哈希', 'md5', 'sha', '多哈希', '批量'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
