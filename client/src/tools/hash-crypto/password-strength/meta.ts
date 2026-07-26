import type { ToolDefinition } from '../../types';
export default {
  id: 'password-strength',
  name: 'Password Strength',
  category: 'hash-crypto',
  group: '其他',
  keywords: ['password', 'strength', '密码强度', 'entropy'],
  modes: ['analyze'],
  exampleInput: 'MyP@ssw0rd123!',
} satisfies ToolDefinition;
