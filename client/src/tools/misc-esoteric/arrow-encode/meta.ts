import type { ToolDefinition } from '../../types';

export default {
  id: 'arrow-encode',
  name: '箭头编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['arrow', '箭头', '方向', '编码', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hi',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
