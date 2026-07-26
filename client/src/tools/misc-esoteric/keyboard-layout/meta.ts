import type { ToolDefinition } from '../../types';

export default {
  id: 'keyboard-layout',
  name: '键盘布局转换',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['keyboard', 'layout', 'qwerty', 'dvorak', 'azerty', '键盘', '布局', '转换'],
  modes: ['execute'],
  exampleInput: 'Hello World',
  defaultParams: { from: 'qwerty', to: 'dvorak' },
} satisfies ToolDefinition;
