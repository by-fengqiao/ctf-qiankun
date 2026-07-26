import type { ToolDefinition } from '../../types';

export default {
  id: 'base64url',
  name: 'Base64URL',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base64url', 'url-safe', 'url安全'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
