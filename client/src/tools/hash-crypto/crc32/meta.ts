import type { ToolDefinition } from '../../types';
export default {
  id: 'crc32',
  name: 'CRC32',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['crc32', 'crc-32', 'checksum', '校验'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
