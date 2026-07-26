import type { ToolDefinition } from '../../types';

export default {
  id: 'cors-checker',
  name: 'CORS配置检测',
  description: '检测 CORS 配置安全性，分析风险等级并给出利用方法与修复建议',
  category: 'web-security',
  group: 'XSS/前端',
  keywords: ['cors', 'cross-origin', 'access-control', 'aca', 'origin', 'credentials', 'preflight', '跨域'],
  modes: ['analyze'],
  exampleInput: 'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true',
} satisfies ToolDefinition;
