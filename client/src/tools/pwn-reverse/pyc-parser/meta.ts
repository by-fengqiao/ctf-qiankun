import type { ToolDefinition } from '../../types';

export default {
  id: 'pyc-parser',
  name: 'Python字节码解析',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['pyc', 'python', 'bytecode', 'marshal', '字节码', 'dis'],
  modes: ['execute'],
  hasFileInput: true,
} satisfies ToolDefinition;
