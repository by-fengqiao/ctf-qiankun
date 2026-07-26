import type { ToolDefinition } from '../../types';

export default {
  id: 'bearer-token',
  name: 'Bearer Token 提取',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['bearer', 'token', 'jwt', 'authorization', 'oauth'],
  modes: ['analyze'],
  exampleInput:
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4f',
} satisfies ToolDefinition;
