import type { ToolDefinition } from '../../types';
export default {
  id: 'random-password',
  name: 'Random Password',
  category: 'hash-crypto',
  group: '其他',
  keywords: ['password', 'random', '随机密码', '生成密码', 'generate'],
  modes: ['generate'],
  exampleInput: '',
} satisfies ToolDefinition;
