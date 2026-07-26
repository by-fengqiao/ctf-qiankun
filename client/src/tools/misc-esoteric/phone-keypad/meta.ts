import type { ToolDefinition } from '../../types';

export default {
  id: 'phone-keypad',
  name: '手机键盘编码',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['phone', 'keypad', '手机', '键盘', '数字', 'encode'],
  modes: ['encode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
