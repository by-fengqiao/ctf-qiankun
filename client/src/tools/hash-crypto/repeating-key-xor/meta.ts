import type { ToolDefinition } from '../../types';
export default {
  id: 'repeating-key-xor',
  name: 'Repeating Key XOR',
  category: 'hash-crypto',
  group: 'XOR',
  keywords: ['xor', 'repeating-key-xor', '异或', '循环密钥'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
  defaultParams: { key: 'key' },
} satisfies ToolDefinition;
