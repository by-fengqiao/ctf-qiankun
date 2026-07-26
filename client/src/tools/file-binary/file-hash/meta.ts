import type { ToolDefinition } from '../../types';
export default {
  id: 'file-hash',
  name: '文件哈希',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha512', '文件', '摘要', 'checksum'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
  defaultParams: { algorithm: 'MD5' },
} satisfies ToolDefinition;
