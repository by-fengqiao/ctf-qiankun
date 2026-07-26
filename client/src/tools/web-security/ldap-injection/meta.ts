import type { ToolDefinition } from '../../types';

export default {
  id: 'ldap-injection',
  name: 'LDAP注入Payload',
  description: '生成 LDAP 注入 Payload（通配符、括号闭合、AND/OR 注入、盲注）',
  category: 'web-security',
  group: '注入',
  keywords: ['ldap', 'ldap injection', '目录服务', 'ldap注入', 'wildcard', 'blind'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { point: 'username', bypass: 'none' },
} satisfies ToolDefinition;
