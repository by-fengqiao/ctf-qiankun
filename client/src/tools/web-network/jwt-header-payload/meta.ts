import type { ToolDefinition } from '../../types';

export default {
  id: 'jwt-header-payload',
  name: 'JWT 解码',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['jwt', 'json', 'web', 'token', 'header', 'payload', 'decode'],
  modes: ['analyze'],
  exampleInput:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpXJF',
} satisfies ToolDefinition;
