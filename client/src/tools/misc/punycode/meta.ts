import type { ToolDefinition } from '../../types';

export default {
  id: 'punycode',
  name: 'Punycode 编码转换',
  description: 'RFC 3492 Punycode 编码/解码，支持 IDNA 域名格式',
  category: 'misc',
  group: '杂项',
  keywords: ['punycode', 'idna', 'rfc3492', '域名', 'unicode', 'xn--'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: '中文.com',
  defaultParams: { mode: 'encode' },
} satisfies ToolDefinition;
