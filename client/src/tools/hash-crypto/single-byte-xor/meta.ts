import type { ToolDefinition } from '../../types';
export default {
  id: 'single-byte-xor',
  name: 'Single Byte XOR',
  category: 'hash-crypto',
  group: 'XOR',
  keywords: ['xor', 'single-byte-xor', '异或'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
  defaultParams: { key: '0x41' },
} satisfies ToolDefinition;
