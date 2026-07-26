import type { ToolDefinition } from '../../types';

export default {
  id: 'js-sandbox',
  name: 'JS 沙箱执行器',
  description: '在受限作用域中执行 JavaScript 代码，提供安全工具函数',
  category: 'misc',
  group: '杂项',
  keywords: ['javascript', 'js', 'sandbox', '沙箱', '执行', 'eval', 'repl'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: 'console.log("Hello");\nconst x = 1 + 2;\nreturn x;',
  defaultParams: { timeout: '1000' },
} satisfies ToolDefinition;
