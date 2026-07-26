import type { ToolDefinition } from '../../types';

export default {
  id: 'quoted-printable',
  name: 'Quoted-Printable 编码',
  description: 'RFC 2045 Quoted-Printable 编解码，处理 =XX 转义和软换行',
  category: 'misc',
  group: '杂项',
  keywords: ['quoted-printable', 'qp', 'rfc2045', 'mime', 'email', '编码'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: 'Hello, 世界!',
  defaultParams: { mode: 'encode' },
} satisfies ToolDefinition;
