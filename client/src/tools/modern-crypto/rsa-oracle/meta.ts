import type { ToolDefinition } from '../../types';

export default {
  id: 'rsa-oracle',
  name: 'RSA Oracle攻击',
  description: 'RSA Oracle攻击辅助：奇偶性、LSB、同态性质，交互式二分搜索恢复明文',
  category: 'modern-crypto',
  group: 'RSA',
  keywords: ['rsa', 'oracle', 'parity', 'lsb', 'homomorphic', '二分搜索'],
  modes: ['execute'],
  exampleInput: '0x...n...\n0x...e...\n0x...c...',
  defaultParams: { mode: 'parity', step: '0', bit: '', bound: '' },
} satisfies ToolDefinition;
