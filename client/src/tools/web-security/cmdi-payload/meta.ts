import type { ToolDefinition } from '../../types';

export default {
  id: 'cmdi-payload',
  name: '命令注入Payload',
  description: '生成命令注入 payload，支持 Linux/Windows 及多种绕过方式',
  category: 'web-security',
  group: '注入',
  keywords: ['命令注入', 'command injection', 'cmdi', 'rce', 'shell', 'pipe', 'backtick', '绕过'],
  modes: ['generate'],
  paramsConfig: [
    {
      name: 'os',
      label: '系统',
      type: 'select',
      default: 'Linux',
      options: [
        { value: 'Linux', label: 'Linux' },
        { value: 'Windows', label: 'Windows' },
      ],
    },
    {
      name: 'bypass',
      label: '绕过',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: '无' },
        { value: 'no-space', label: '无空格' },
        { value: 'no-slash', label: '无斜杠' },
        { value: 'no-cmd', label: '无命令关键字' },
        { value: 'wildcard', label: '通配符' },
        { value: 'base64', label: 'Base64' },
      ],
    },
  ],
  exampleInput: 'id',
} satisfies ToolDefinition;
