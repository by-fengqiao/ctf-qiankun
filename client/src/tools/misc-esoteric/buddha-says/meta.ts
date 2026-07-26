import type { ToolDefinition } from '../../types';

export default {
  id: 'buddha-says',
  name: '佛曰',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['buddha', '佛曰', '佛说', '与佛论禅', 'encode', 'decode', '编码'],
  modes: ['encode', 'decode'],
  exampleInput: '阿弥陀佛',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
