import type { ToolDefinition } from '../../types';
export default {
  id: 'hkdf',
  name: 'HKDF',
  category: 'hash-crypto',
  group: 'HMAC/KDF',
  keywords: ['hkdf', 'key', 'derivation', '密钥派生', 'rfc5869'],
  modes: ['execute'],
  exampleInput: 'input-key-material',
} satisfies ToolDefinition;
