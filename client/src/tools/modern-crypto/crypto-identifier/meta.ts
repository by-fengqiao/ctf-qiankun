import type { ToolDefinition } from '../../types';

export default {
  id: 'crypto-identifier',
  name: '密码编码识别器',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['identify', '识别', 'base64', 'hex', 'jwt', 'pem', 'bitcoin', '编码识别'],
  modes: ['analyze'],
} satisfies ToolDefinition;
