import type { ToolDefinition } from '../../types';

export default {
  id: 'shamir-secret',
  name: 'Shamir秘密分享',
  description: 'Shamir门限秘密分享方案: 生成分享和恢复秘密, 使用拉格朗日插值',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['shamir', '秘密分享', '门限方案', 'lagrange', '拉格朗日插值', 'secret sharing'],
  modes: ['execute'],
  exampleInput: 'secret_hex\nk\nn\np',
  defaultParams: { mode: 'share' },
} satisfies ToolDefinition;
