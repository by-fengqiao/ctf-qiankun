import type { ToolDefinition } from '../../types';
export default {
  id: 'jwt-parse',
  name: 'JWT Parse',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['jwt', 'json-web-token', 'token', 'jwt-parse'],
  modes: ['analyze'],
  exampleInput: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
} satisfies ToolDefinition;
