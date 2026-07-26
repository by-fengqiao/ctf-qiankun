import type { ToolDefinition } from '../../types';
export default {
  id: 'hmac-sha512',
  name: 'HMAC-SHA512',
  category: 'hash-crypto',
  group: 'HMAC/KDF',
  keywords: ['hmac', 'sha512', 'hmac-sha512', '哈希', '消息认证码'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
