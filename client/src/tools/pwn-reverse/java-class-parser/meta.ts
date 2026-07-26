import type { ToolDefinition } from '../../types';

export default {
  id: 'java-class-parser',
  name: 'Java-Class解析',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['java', 'class', 'jvm', 'bytecode', 'cafobabe', 'class文件'],
  modes: ['execute'],
  hasFileInput: true,
} satisfies ToolDefinition;
