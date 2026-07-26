import type { ToolDefinition } from '../../types';
export default {
  id: 'pem-parse',
  name: 'PEM Parse',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['pem', 'certificate', 'key', 'pem-parse'],
  modes: ['analyze'],
  exampleInput: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----',
} satisfies ToolDefinition;
