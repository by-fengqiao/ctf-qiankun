import type { ToolDefinition } from '../../types';

export default {
  id: 'hash-length-extension',
  name: '哈希长度扩展攻击',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['hash', 'length', 'extension', 'md5', 'sha1', 'sha256', '长度扩展'],
  modes: ['execute'],
  defaultParams: { mode: 'md5' },
} satisfies ToolDefinition;
