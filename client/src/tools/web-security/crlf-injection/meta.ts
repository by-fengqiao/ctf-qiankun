import type { ToolDefinition } from '../../types';

export default {
  id: 'crlf-injection',
  name: 'CRLF/HTTP头注入Payload',
  description: '生成 CRLF 注入、HTTP 头注入、HTTP 响应拆分 Payload 变体',
  category: 'web-security',
  group: '注入',
  keywords: ['crlf', 'http header injection', 'response splitting', '头注入', 'crlf injection'],
  modes: ['generate'],
  exampleInput: '在 URL 参数或输入框中注入换行符',
  defaultParams: {},
} satisfies ToolDefinition;
