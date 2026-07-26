import type { ToolDefinition } from '../../types';
export default {
  id: 'hmac-md5',
  name: 'HMAC-MD5',
  category: 'hash-crypto',
  group: 'HMAC/KDF',
  keywords: ['hmac', 'hmac-md5', 'md5', 'keyed-hash'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
  defaultParams: { key: 'secret' },
} satisfies ToolDefinition;
