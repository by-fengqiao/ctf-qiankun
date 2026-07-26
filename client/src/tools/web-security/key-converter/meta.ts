import type { ToolDefinition } from '../../types';

export default {
  id: 'key-converter',
  name: '密钥格式转换',
  description: 'RSA/EC/Ed25519 密钥格式转换 (PEM/DER/JWK/SSH)，提取公钥并计算指纹',
  category: 'web-security',
  group: '认证/会话',
  keywords: ['密钥', 'key', 'pem', 'der', 'jwk', 'ssh', 'rsa', 'ec', 'ed25519', 'fingerprint', '公钥'],
  modes: ['convert'],
  paramsConfig: [
    {
      name: 'format',
      label: '输出格式',
      type: 'select',
      default: 'PEM',
      options: [
        { value: 'PEM', label: 'PEM' },
        { value: 'DER', label: 'DER Hex' },
        { value: 'JWK', label: 'JWK JSON' },
        { value: 'SSH', label: 'SSH Public Key' },
      ],
    },
  ],
  exampleInput: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----',
} satisfies ToolDefinition;
