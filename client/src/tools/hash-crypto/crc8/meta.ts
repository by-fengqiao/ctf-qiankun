import type { ToolDefinition } from '../../types';
export default {
  id: 'crc8',
  name: 'CRC8',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['crc8', 'crc-8', 'checksum', '校验'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
