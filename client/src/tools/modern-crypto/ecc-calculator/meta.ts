import type { ToolDefinition } from '../../types';

export default {
  id: 'ecc-calculator',
  name: '椭圆曲线计算器',
  category: 'modern-crypto',
  group: '椭圆曲线',
  keywords: ['ecc', 'elliptic', 'curve', '点加', '标量乘法', '离散对数'],
  modes: ['execute'],
  defaultParams: { mode: 'point-add', preset: 'secp256k1' },
} satisfies ToolDefinition;
