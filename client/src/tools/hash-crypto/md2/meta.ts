import type { ToolDefinition } from '../../types';
export default {
  id: 'md2',
  name: 'MD2',
  category: 'hash-crypto',
  group: '哈希',
  keywords: ['md2', 'hash', '哈希', 'rfc1319'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
