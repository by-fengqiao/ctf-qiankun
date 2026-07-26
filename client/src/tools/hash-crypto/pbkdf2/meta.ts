import type { ToolDefinition } from '../../types';
export default {
  id: 'pbkdf2',
  name: 'PBKDF2',
  category: 'hash-crypto',
  group: 'HMAC/KDF',
  keywords: ['pbkdf2', 'key', 'derivation', '密钥派生', 'kdf'],
  modes: ['execute'],
  exampleInput: 'password123',
} satisfies ToolDefinition;
