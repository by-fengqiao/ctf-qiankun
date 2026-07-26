import type { ToolDefinition } from '../../types';

export default {
  id: 'hundred-surnames',
  name: '百家姓密码',
  category: 'misc-esoteric',
  group: '趣味编码',
  keywords: ['hundred', 'surnames', '百家姓', '姓氏', '密码', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
