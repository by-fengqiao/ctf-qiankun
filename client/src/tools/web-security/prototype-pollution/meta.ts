import type { ToolDefinition } from '../../types';

export default {
  id: 'prototype-pollution',
  name: '原型链污染Payload',
  description: '生成原型链污染 payload，支持 lodash/merge/qs/jquery/express 等库',
  category: 'web-security',
  group: 'XSS/前端',
  keywords: ['原型链污染', 'prototype pollution', 'lodash', 'merge', 'qs', 'jquery', '__proto__', 'constructor'],
  modes: ['generate'],
  paramsConfig: [
    {
      name: 'lib',
      label: '库',
      type: 'select',
      default: 'lodash',
      options: [
        { value: 'lodash', label: 'lodash' },
        { value: 'merge', label: 'merge' },
        { value: 'qs', label: 'qs' },
        { value: 'jquery', label: 'jQuery' },
        { value: 'express', label: 'Express' },
      ],
    },
    {
      name: 'target',
      label: '目标',
      type: 'select',
      default: 'rce',
      options: [
        { value: 'rce', label: 'RCE' },
        { value: 'logic-bypass', label: '逻辑绕过' },
        { value: 'xss', label: 'XSS' },
      ],
    },
  ],
  exampleInput: '{"key":"value"}',
} satisfies ToolDefinition;
