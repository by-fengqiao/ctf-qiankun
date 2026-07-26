import type { ToolDefinition } from '../../types';
export default {
  id: 'hmac-sha256',
  name: 'HMAC-SHA256',
  category: 'hash-crypto',
  group: 'HMAC/KDF',
  keywords: ['hmac', 'hmac-sha256', 'sha256', 'keyed-hash'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
  defaultParams: { key: 'secret' },
} satisfies ToolDefinition;
