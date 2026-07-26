import type { ToolDefinition } from '../../types';
export default {
  id: 'hotp',
  name: 'HOTP',
  category: 'hash-crypto',
  group: 'OTP',
  keywords: ['hotp', 'otp', '2fa', '验证码', '计数器', 'counter'],
  modes: ['generate'],
  exampleInput: 'JBSWY3DPEHPK3PXP',
} satisfies ToolDefinition;
