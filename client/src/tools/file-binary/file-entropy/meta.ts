import type { ToolDefinition } from '../../types';
export default {
  id: 'file-entropy',
  name: 'Shannon熵计算',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['entropy', 'shannon', '熵', '随机性', 'entropy'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
