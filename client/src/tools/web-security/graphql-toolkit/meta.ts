import type { ToolDefinition } from '../../types';

export default {
  id: 'graphql-toolkit',
  name: 'GraphQL工具',
  description: 'GraphQL 内省查询/注入/字段推测 payload 生成',
  category: 'web-security',
  group: '其他',
  keywords: ['graphql', '内省', 'introspection', 'injection', 'alias', 'batch', 'DoS', '字段推测'],
  modes: ['execute'],
  paramsConfig: [
    {
      name: 'mode',
      label: '模式',
      type: 'select',
      default: 'introspection',
      options: [
        { value: 'introspection', label: '内省查询' },
        { value: 'injection', label: '注入攻击' },
        { value: 'field-suggest', label: '字段推测' },
      ],
    },
  ],
  exampleInput: 'http://target.com/graphql',
} satisfies ToolDefinition;
