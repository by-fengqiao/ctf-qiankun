import type { ToolDefinition } from '../../types';

export default {
  id: 'ieee754',
  name: 'IEEE 754 浮点数转换',
  description: 'IEEE 754 浮点数与十六进制互转，展示符号位/指数/尾数位布局',
  category: 'misc',
  group: '杂项',
  keywords: ['ieee754', 'float', 'double', '浮点数', 'float32', 'float64', 'hex'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: '3.14',
  defaultParams: { format: 'float32', mode: 'encode' },
} satisfies ToolDefinition;
