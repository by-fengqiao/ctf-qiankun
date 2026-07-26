import type { ToolDefinition } from '../../types';

export default {
  id: 'snow-stego',
  name: 'SNOW 隐写',
  description: '在文本末尾的空白字符中隐藏/提取消息',
  category: 'misc',
  group: '杂项',
  keywords: ['snow', 'steganography', 'whitespace', '隐写', '空白', 'tab', 'space'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: '这是一段掩护文本。',
  defaultParams: { mode: 'hide', password: '' },
} satisfies ToolDefinition;
