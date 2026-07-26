import type { ToolDefinition } from '../../types';
export default {
  id: 'bmp-header',
  name: 'BMP头解析',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['bmp', 'bitmap', 'header', 'BMP', '位图'],
  modes: ['analyze'],
  exampleInput: '424d36040000000000003600000028000000010000000100000001001800',
} satisfies ToolDefinition;
