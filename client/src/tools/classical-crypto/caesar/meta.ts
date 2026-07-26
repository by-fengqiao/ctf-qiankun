import type { ToolDefinition } from '../../types';

export default {
  id: 'caesar',
  name: '凯撒密码',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['caesar', '凯撒', '移位', 'shift'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
  defaultParams: { shift: '3' },
} satisfies ToolDefinition;
