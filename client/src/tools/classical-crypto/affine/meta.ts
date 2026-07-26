import type { ToolDefinition } from '../../types';

export default {
  id: 'affine',
  name: '仿射密码',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['affine', '仿射', 'ax+b'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
  defaultParams: { a: '5', b: '8' },
} satisfies ToolDefinition;
