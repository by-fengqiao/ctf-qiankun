import type { ToolDefinition } from '../../types';

export default {
  id: 'xss-payload',
  name: 'XSS Payload生成器',
  description: '按上下文与绕过策略生成 XSS Payload 列表',
  category: 'web-security',
  group: 'XSS/前端',
  keywords: ['xss', 'cross-site scripting', '跨站脚本', 'waf bypass', 'payload'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { context: 'html-tag', bypass: 'none' },
} satisfies ToolDefinition;
