import type { ToolDefinition } from '../../types';

export default {
  id: 'set-cookie-parse',
  name: 'Set-Cookie 解析',
  category: 'web-network',
  group: 'Cookie',
  keywords: ['set-cookie', 'parse', 'header', 'http', 'expires', 'domain'],
  modes: ['analyze'],
  exampleInput:
    'sessionId=abc123; Domain=example.com; Path=/; Expires=Wed, 24 Jul 2026 12:00:00 GMT; Secure; HttpOnly; SameSite=Strict',
} satisfies ToolDefinition;
