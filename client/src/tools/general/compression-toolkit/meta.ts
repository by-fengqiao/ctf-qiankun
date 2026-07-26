import type { ToolDefinition } from '../../types';

export default {
  id: 'compression-toolkit',
  name: '压缩工具集',
  description: '解析 gzip/zlib/brotli 头部信息，LZ77 回引解码，原始解压',
  category: 'general',
  group: '工具',
  keywords: ['compression', 'gzip', 'zlib', 'brotli', 'deflate', 'lz77', '压缩', '解压'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: '1F 8B 08 00 00 00 00 00 00 03',
  defaultParams: { mode: 'gzip-info' },
} satisfies ToolDefinition;
