import type { ToolDefinition } from '../../types';

export default {
  id: 'heap-visualizer',
  name: '堆利用布局器',
  category: 'pwn-reverse',
  group: '利用构造',
  keywords: ['heap', '堆', 'tcache', 'fastbin', 'uaf', 'double free', 'glibc', 'pwn'],
  modes: ['execute'],
  defaultParams: { mode: 'malloc' },
} satisfies ToolDefinition;
