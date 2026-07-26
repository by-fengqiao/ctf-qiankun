import type { ToolDefinition } from '../../types';

export default {
  id: 'dirb-generator',
  name: '目录爆破字典生成器',
  description: '按语言与类型生成目录爆破路径字典',
  category: 'web-security',
  group: '其他',
  keywords: ['dirb', 'directory', 'wordlist', '目录爆破', 'fuzz', 'gobuster'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { lang: 'php', type: 'admin', prefix: '', suffix: '' },
} satisfies ToolDefinition;
