import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-reverse-bytes',
  name: 'Hex字节反转',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'reverse', '字节', '反转', 'reverse bytes'],
  modes: ['execute'],
  exampleInput: 'aabbccdd',
} satisfies ToolDefinition;
