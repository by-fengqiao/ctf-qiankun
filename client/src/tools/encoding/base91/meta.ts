import type { ToolDefinition } from '../../types';

export default {
  id: 'base91',
  name: 'Base91',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base91', '九十一进制', 'basE91'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
