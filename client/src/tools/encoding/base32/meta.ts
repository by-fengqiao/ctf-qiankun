import type { ToolDefinition } from '../../types';

export default {
  id: 'base32',
  name: 'Base32',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base32', 'rfc4648', '三十二进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
