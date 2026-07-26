import type { ToolDefinition } from '../../types';
export default {
  id: 'totp',
  name: 'TOTP',
  category: 'hash-crypto',
  group: 'OTP',
  keywords: ['totp', 'otp', '2fa', '验证码', '动态密码', '时间'],
  modes: ['generate'],
  exampleInput: 'JBSWY3DPEHPK3PXP',
} satisfies ToolDefinition;
