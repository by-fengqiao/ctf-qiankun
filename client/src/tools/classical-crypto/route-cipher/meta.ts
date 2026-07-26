import type { ToolDefinition } from '../../types';

export default {
  id: 'route-cipher',
  name: '路线密码',
  category: 'classical-crypto',
  group: '换位',
  keywords: ['route', '路线', 'spiral', '螺旋'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { cols: '4' },
} satisfies ToolDefinition;
