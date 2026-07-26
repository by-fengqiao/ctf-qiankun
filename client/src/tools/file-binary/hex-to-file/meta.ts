import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-to-file',
  name: 'Hex转文件下载',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'file', 'download', 'blob', '十六进制', '转文件', '下载'],
  modes: ['execute'],
  exampleInput: '48656c6c6f20576f726c64',
} satisfies ToolDefinition;
