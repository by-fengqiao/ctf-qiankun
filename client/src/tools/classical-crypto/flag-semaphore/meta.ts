import type { ToolDefinition } from '../../types';

export default {
  id: 'flag-semaphore',
  name: '旗语密码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['semaphore', 'flag', '旗语', '旗帜'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
