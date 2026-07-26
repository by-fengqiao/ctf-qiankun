import type { ToolDefinition } from '../../types';

export default {
  id: 'substitution-breaker',
  name: '替换密码频率分析',
  description: '统计密文字母频率，对照英语频率表给出可能的映射建议',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['frequency', 'analysis', '频率分析', 'substitution breaker'],
  modes: ['analyze'],
  exampleInput: 'GSRHRHNVHHKVBZHRMUGSZGGOVNVRMGVULIGSRHR',
} satisfies ToolDefinition;
