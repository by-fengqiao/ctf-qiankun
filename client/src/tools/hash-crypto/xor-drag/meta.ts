import type { ToolDefinition } from '../../types';
export default {
  id: 'xor-drag',
  name: 'XOR Crib Drag',
  category: 'hash-crypto',
  group: 'XOR',
  keywords: ['xor', 'crib-drag', 'crib', '异或', ' crib拖拽'],
  modes: ['analyze'],
  exampleInput: 'deadbeefcafe',
  defaultParams: { crib: 'the', position: '0' },
} satisfies ToolDefinition;
