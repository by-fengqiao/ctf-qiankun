import type { ToolDefinition } from '../../types';

export default {
  id: 'hex-reverse',
  name: 'Hex 反转',
  category: 'encoding',
  group: 'Hex/进制',
  keywords: ['hex', 'reverse', 'hex反转', '字节反转', '十六进制'],
  modes: ['generate'],
  exampleInput: '48656c6c6f',
} satisfies ToolDefinition;
