import type { ToolDefinition } from '../../types';
export default {
  id: 'rsa-public-key',
  name: 'RSA Public Key',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['rsa', 'public-key', 'rsa-public-key'],
  modes: ['analyze'],
  exampleInput: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
} satisfies ToolDefinition;
