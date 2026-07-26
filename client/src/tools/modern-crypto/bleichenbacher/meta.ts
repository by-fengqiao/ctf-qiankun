import type { ToolDefinition } from '../../types';

export default {
  id: 'bleichenbacher',
  name: 'Bleichenbacher攻击',
  description: 'RSA PKCS#1 v1.5 Bleichenbacher padding oracle攻击辅助工具，交互式二分搜索恢复明文',
  category: 'modern-crypto',
  group: 'RSA',
  keywords: ['bleichenbacher', 'padding oracle', 'pkcs', 'rsa', '攻击'],
  modes: ['execute'],
  exampleInput: '0x...n...\n0x...e...\n0x...c...',
  defaultParams: { step: '0', s: '', oracle: 'unknown' },
} satisfies ToolDefinition;
