import type { ToolDefinition } from '../../types';

export default {
  id: 'base64',
  name: 'Base64',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base64', '六十四进制', 'base sixty-four'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
