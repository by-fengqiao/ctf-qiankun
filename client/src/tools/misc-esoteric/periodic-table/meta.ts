import type { ToolDefinition } from '../../types';

export default {
  id: 'periodic-table',
  name: '元素周期表编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['periodic', 'table', 'element', '元素', '周期表', '化学', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
