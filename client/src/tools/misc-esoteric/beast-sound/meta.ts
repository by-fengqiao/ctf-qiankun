import type { ToolDefinition } from '../../types';

export default {
  id: 'beast-sound',
  name: '兽音编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['beast', '兽音', '兽语', '嗷呜', 'encode', 'decode', '编码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
