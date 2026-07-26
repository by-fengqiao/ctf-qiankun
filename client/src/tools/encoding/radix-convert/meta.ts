import type { ToolDefinition } from '../../types';

export default {
  id: 'radix-convert',
  name: '进制转换',
  category: 'encoding',
  group: 'Hex/进制',
  keywords: ['radix', 'base', '进制', '进制转换', 'radix convert'],
  modes: ['generate'],
  exampleInput: '255',
  defaultParams: { from: '10', to: '16' },
} satisfies ToolDefinition;
