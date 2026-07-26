import type { ToolDefinition } from '../../types';

export default {
  id: 'number-theory',
  name: '数论计算器',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['gcd', 'egcd', 'modinv', 'crt', 'powmod', 'primitive-root', 'discrete-log', 'euler', 'miller-rabin', 'pollard-rho'],
  modes: ['execute'],
  defaultParams: { mode: 'gcd' },
} satisfies ToolDefinition;
