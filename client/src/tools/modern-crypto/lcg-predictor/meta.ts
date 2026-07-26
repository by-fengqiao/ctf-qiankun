import type { ToolDefinition } from '../../types';

export default {
  id: 'lcg-predictor',
  name: 'LCG预测器',
  category: 'modern-crypto',
  group: '随机数',
  keywords: ['lcg', '线性同余', 'predictor', 'prng', '随机数预测'],
  modes: ['execute'],
  defaultParams: { mode: 'known-m', m: '', count: '10' },
} satisfies ToolDefinition;
