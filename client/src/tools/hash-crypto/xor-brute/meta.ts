import type { ToolDefinition } from '../../types';
export default {
  id: 'xor-brute',
  name: 'XOR Brute Force',
  category: 'hash-crypto',
  group: 'XOR',
  keywords: ['xor', 'brute-force', '暴力破解', '异或'],
  modes: ['analyze'],
  exampleInput: '1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736',
} satisfies ToolDefinition;
