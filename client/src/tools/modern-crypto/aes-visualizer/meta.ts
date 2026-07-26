import type { ToolDefinition } from '../../types';

export default {
  id: 'aes-visualizer',
  name: 'AES可视化',
  category: 'modern-crypto',
  group: '对称密码',
  keywords: ['aes', '加密', 'sbox', 'rijndael', '可视化'],
  modes: ['execute'],
  defaultParams: { 'key-size': '128' },
} satisfies ToolDefinition;
