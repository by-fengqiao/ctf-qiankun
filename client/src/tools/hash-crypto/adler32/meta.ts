import type { ToolDefinition } from '../../types';
export default {
  id: 'adler32',
  name: 'Adler32',
  category: 'hash-crypto',
  group: '校验和',
  keywords: ['adler32', 'adler-32', 'checksum', '校验'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
