import type { ToolDefinition } from '../../types';

export default {
  id: 'text-hash-quick',
  name: '快速哈希摘要',
  category: 'text-processing',
  group: '其他',
  keywords: ['哈希', 'hash', '摘要', 'digest', 'md5', 'sha1', 'sha256'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
