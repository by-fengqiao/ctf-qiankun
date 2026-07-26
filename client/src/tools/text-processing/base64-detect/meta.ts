import type { ToolDefinition } from '../../types';

export default {
  id: 'base64-detect',
  name: 'Base64 检测',
  category: 'text-processing',
  group: '其他',
  keywords: ['base64', '检测', 'detect', '验证', 'validate', '识别'],
  modes: ['analyze'],
  exampleInput: 'SGVsbG8gV29ybGQ=',
} satisfies ToolDefinition;
