import type { ToolDefinition } from '../../types';
export default {
  id: 'jwt-verify',
  name: 'JWT Verify',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['jwt', 'verify', '验证', '过期', 'token', 'exp', 'nbf'],
  modes: ['analyze'],
  exampleInput:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
} satisfies ToolDefinition;
