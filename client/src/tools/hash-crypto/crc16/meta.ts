import type { ToolDefinition } from '../../types';
export default {
  id: 'crc16',
  name: 'CRC16-CCITT',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['crc16', 'crc-16', 'ccitt', 'checksum', '校验'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
