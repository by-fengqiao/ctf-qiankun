import type { ToolDefinition } from '../../types';

export default {
  id: 'sqli-payload',
  name: 'SQL注入Payload生成器',
  description: '按数据库与注入类型生成 SQL 注入 Payload，含大小写、注释、双写、编码等 WAF 绕过变体',
  category: 'web-security',
  group: '注入',
  keywords: ['sqli', 'sql injection', 'sql注入', 'union', 'blind', 'waf bypass', 'payload'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { db: 'mysql', type: 'union' },
} satisfies ToolDefinition;
