import type { ToolDefinition } from '../../types';

export default {
  id: 'keyboard-shift',
  name: '键盘移位密码',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['keyboard', '键盘', 'qwerty', 'shift'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'hello',
  defaultParams: { shift: '1', direction: 'right' },
} satisfies ToolDefinition;
