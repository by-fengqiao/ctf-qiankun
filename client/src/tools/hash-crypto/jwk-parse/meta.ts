import type { ToolDefinition } from '../../types';
export default {
  id: 'jwk-parse',
  name: 'JWK Parse',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['jwk', 'json-web-key', 'key', 'jwk-parse'],
  modes: ['analyze'],
  exampleInput: '{"kty":"oct","k":"GawgguFyGrWKav7AX4VKUg"}',
} satisfies ToolDefinition;
