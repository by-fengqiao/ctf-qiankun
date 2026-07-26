import type { ToolDefinition } from '../../types';

export default {
  id: 'packer-identifier',
  name: '壳识别器',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['packer', 'upx', 'themida', 'vmp', 'aspack', '壳', '脱壳'],
  modes: ['execute'],
  hasFileInput: true,
} satisfies ToolDefinition;
