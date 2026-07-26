import type { ToolDefinition } from '../../types';

export default {
  id: 'http-basic-auth',
  name: 'HTTP Basic Auth',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['basic', 'auth', 'base64', 'encode', 'decode', 'authorization'],
  modes: ['encode', 'decode'],
  exampleInput: 'user:password',
} satisfies ToolDefinition;
