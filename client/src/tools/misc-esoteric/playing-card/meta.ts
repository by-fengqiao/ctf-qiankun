import type { ToolDefinition } from '../../types';

export default {
  id: 'playing-card',
  name: '扑克牌编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['playing', 'card', '扑克', '扑克牌', '纸牌', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
