import type { ToolDefinition } from '../../types';

export default {
  id: 'mars-text',
  name: '火星文',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['mars', '火星文', '火星', 'encode', 'decode', '编码'],
  modes: ['encode', 'decode'],
  exampleInput: '今天天气真好',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
