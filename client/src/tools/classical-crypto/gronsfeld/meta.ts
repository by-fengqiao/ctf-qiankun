import type { ToolDefinition } from '../../types';

export default {
  id: 'gronsfeld',
  name: '格罗斯菲尔德密码',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['gronsfeld', '格罗斯菲尔德', '数字密钥维吉尼亚'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: '12345' },
} satisfies ToolDefinition;
