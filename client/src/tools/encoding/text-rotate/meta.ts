import type { ToolDefinition } from '../../types';

export default {
  id: 'text-rotate',
  name: 'ROT13/ROT47',
  category: 'encoding',
  group: '文本变换',
  keywords: ['rot13', 'rot47', 'rotate', '凯撒密码', '旋转', '编码'],
  modes: ['generate'],
  exampleInput: 'Hello World',
  defaultParams: { type: 'rot13' },
} satisfies ToolDefinition;
