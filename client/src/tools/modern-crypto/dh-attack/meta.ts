import type { ToolDefinition } from '../../types';

export default {
  id: 'dh-attack',
  name: 'Diffie-Hellman攻击辅助',
  description: 'DH参数检查(素性/阶/小子群)、Pohlig-Hellman小群攻击、已知私钥计算共享密钥',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['diffie-hellman', 'dh', 'pohlig-hellman', '小群攻击', '离散对数', '密钥交换'],
  modes: ['execute'],
  exampleInput: 'p\ng\nh',
  defaultParams: { mode: 'small-group' },
} satisfies ToolDefinition;
