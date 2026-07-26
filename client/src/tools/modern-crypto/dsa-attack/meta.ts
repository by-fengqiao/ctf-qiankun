import type { ToolDefinition } from '../../types';

export default {
  id: 'dsa-attack',
  name: 'DSA Nonce重用攻击',
  description: '当DSA签名重用随机数k时,通过两组签名(r,s,m)恢复私钥x和nonce k',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['dsa', 'nonce', 'nonce重用', '私钥恢复', '数字签名', 'k重用'],
  modes: ['execute'],
  exampleInput: 'r1 s1 m1\nr2 s2 m2\nq',
} satisfies ToolDefinition;
