import type { ToolDefinition } from '../../types';
export default {
  id: 'file-hex-dump',
  name: '文件Hex转储',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['hex', 'dump', '文件', 'hexdump', 'xxd', '十六进制'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
  defaultParams: { bytesPerLine: '16' },
} satisfies ToolDefinition;
