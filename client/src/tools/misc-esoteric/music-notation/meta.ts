import type { ToolDefinition } from '../../types';

export default {
  id: 'music-notation',
  name: '音符编码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['music', 'notation', 'note', '音符', '乐谱', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hi',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
