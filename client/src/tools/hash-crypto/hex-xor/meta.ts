import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-xor',
  name: 'Hex XOR',
  category: 'hash-crypto',
  group: 'XOR',
  keywords: ['xor', 'hex-xor', '异或', 'hex'],
  modes: ['analyze'],
  exampleInput: 'deadbeef',
  defaultParams: { key: 'cafe' },
} satisfies ToolDefinition;
