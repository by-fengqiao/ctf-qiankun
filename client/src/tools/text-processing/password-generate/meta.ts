import type { ToolDefinition } from '../../types';

export default {
  id: 'password-generate',
  name: '密码生成',
  category: 'text-processing',
  group: '生成',
  keywords: ['密码', '生成', 'password', 'random password', '密码生成'],
  modes: ['generate'],
  exampleInput: '',
} satisfies ToolDefinition;
