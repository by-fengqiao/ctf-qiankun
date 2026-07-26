import type { ToolDefinition } from '../../types';

export default {
  id: 't9-encode',
  name: 'T9 编码',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['t9', 'phone', 'multi-tap', '手机', '按键', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
