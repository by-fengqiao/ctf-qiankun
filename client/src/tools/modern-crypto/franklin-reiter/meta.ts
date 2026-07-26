import type { ToolDefinition } from '../../types';

export default {
  id: 'franklin-reiter',
  name: 'Franklin-Reiter相关消息攻击',
  description: '当两条明文满足 m2 = m1 + delta 时，通过多项式GCD模n恢复明文',
  category: 'modern-crypto',
  group: 'RSA',
  keywords: ['franklin-reiter', 'rsa', '相关消息', '多项式gcd', 'coppersmith'],
  modes: ['execute'],
  exampleInput: 'n\ne\nc1\nc2\ndelta',
} satisfies ToolDefinition;
