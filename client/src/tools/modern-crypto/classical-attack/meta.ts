import type { ToolDefinition } from '../../types';

export default {
  id: 'classical-attack',
  name: '古典密码自动攻击',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['ic', 'kasiski', 'vigenere', '频率分析', 'crib', '攻击'],
  modes: ['execute'],
  defaultParams: { mode: 'ic' },
} satisfies ToolDefinition;
