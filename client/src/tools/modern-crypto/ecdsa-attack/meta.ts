import type { ToolDefinition } from '../../types';

export default {
  id: 'ecdsa-attack',
  name: 'ECDSA攻击工具',
  description: 'ECDSA nonce重用/偏置/过小攻击，恢复私钥 d（secp256k1 / P-256）',
  category: 'modern-crypto',
  group: '椭圆曲线',
  keywords: ['ecdsa', 'nonce重用', 'nonce偏置', '小nonce', 'secp256k1', 'p-256', '椭圆曲线'],
  modes: ['execute'],
  exampleInput: 'nonce-reuse:\nr\ns1\nz1\ns2\nz2',
} satisfies ToolDefinition;
