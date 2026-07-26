import type { ToolDefinition } from '../../types';

export default {
  id: 'rail-fence',
  name: '栅栏密码',
  category: 'classical-crypto',
  group: '换位',
  keywords: ['rail-fence', '栅栏', 'zigzag', '之字形'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { rails: '2' },
} satisfies ToolDefinition;
