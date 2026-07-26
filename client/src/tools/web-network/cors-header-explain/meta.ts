import type { ToolDefinition } from '../../types';

export default {
  id: 'cors-header-explain',
  name: 'CORS 头解释',
  category: 'web-network',
  group: '其他',
  keywords: ['cors', 'header', 'cross-origin', 'explain', 'http'],
  modes: ['analyze'],
  exampleInput:
    'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: GET, POST\nAccess-Control-Allow-Headers: Content-Type\nAccess-Control-Allow-Credentials: true',
} satisfies ToolDefinition;
