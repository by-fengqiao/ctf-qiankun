import type { ToolDefinition } from '../../types';
export default {
  id: 'compression-detect',
  name: '压缩格式检测',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['compression', 'detect', 'gzip', 'zlib', 'bzip2', 'xz', '压缩', '检测'],
  modes: ['analyze'],
  exampleInput: '1f8b0800000000000003',
} satisfies ToolDefinition;
