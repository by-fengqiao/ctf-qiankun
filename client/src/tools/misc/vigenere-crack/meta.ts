import type { ToolDefinition } from '../../types';

export default {
  id: 'vigenere-crack',
  name: '维吉尼亚密码破解',
  description: '通过 Kasiski 检验和频率分析自动破解维吉尼亚密码',
  category: 'misc',
  group: '杂项',
  keywords: ['vigenere', 'crack', 'break', 'kasiski', '频率分析', '维吉尼亚', '破解'],
  modes: ['analyze'],
  hasFileInput: false,
  exampleInput: 'VHIHGWEGWQOPRNDAIQHXPMKBRGHUMRWNXKRWMDWO',
} satisfies ToolDefinition;
