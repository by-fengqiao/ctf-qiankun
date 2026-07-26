import type { ToolDefinition } from '../../types';

export default {
  id: 'atbash',
  name: '埃特巴什密码',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['atbash', '埃特巴什', '反转', 'reverse'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
