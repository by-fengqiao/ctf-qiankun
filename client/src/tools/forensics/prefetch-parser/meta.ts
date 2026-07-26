import type { ToolDefinition } from '../../types';

export default {
  id: 'prefetch-parser',
  name: 'Prefetch文件解析',
  description: '解析 Windows Prefetch (.pf) 文件，提取可执行文件名、运行次数、最后运行时间和加载的DLL列表',
  category: 'forensics',
  group: 'Windows',
  keywords: ['prefetch', 'pf', '预读取', 'MAMA', '运行记录', 'DLL列表', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '4D414D4111000000400200004E006F00740065007000610064000000...',
} satisfies ToolDefinition;
