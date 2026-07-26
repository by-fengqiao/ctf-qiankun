import type { ToolDefinition } from '../../types';

export default {
  id: 'http-smuggling',
  name: 'HTTP请求走私辅助',
  description: '生成 CL.TE / TE.CL / TE.TE 请求走私测试载荷',
  category: 'web-security',
  group: '其他',
  keywords: ['http smuggling', '请求走私', 'cl.te', 'te.cl', 'desync', 'request smuggling'],
  modes: ['generate'],
  exampleInput: '/',
  defaultParams: { type: 'cl-te' },
} satisfies ToolDefinition;
