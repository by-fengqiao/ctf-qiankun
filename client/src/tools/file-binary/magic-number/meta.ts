import type { ToolDefinition } from '../../types';
export default {
  id: 'magic-number',
  name: '文件签名识别',
  description: '通过文件头魔数（Magic Number）识别文件格式',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['magic', 'number', 'signature', 'header', '魔数', '签名'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
  defaultParams: { byteCount: '32' },
} satisfies ToolDefinition;
