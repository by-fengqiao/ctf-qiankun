import type { ToolDefinition } from '../../types';

export default {
  id: 'emoji-encode',
  name: 'Emoji 编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['emoji', '表情', '编码', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
