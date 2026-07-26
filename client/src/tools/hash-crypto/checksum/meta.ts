import type { ToolDefinition } from '../../types';
export default {
  id: 'checksum',
  name: 'Byte Checksum',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['checksum', 'byte-sum', '校验和', '累加和'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
