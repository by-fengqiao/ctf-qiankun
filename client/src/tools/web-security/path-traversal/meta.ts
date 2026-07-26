import type { ToolDefinition } from '../../types';

export default {
  id: 'path-traversal',
  name: '路径穿越Payload',
  description: '生成路径穿越 payload，支持 Linux/Windows 及编码绕过',
  category: 'web-security',
  group: '文件/路径',
  keywords: ['路径穿越', 'path traversal', 'directory traversal', 'lfi', '../../../etc/passwd', '绕过'],
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
      name: 'depth',
      label: '深度',
      type: 'text',
      default: '5',
      placeholder: '回溯层数',
    },
    {
      name: 'bypass',
      label: '绕过',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: '无' },
        { value: 'double-encode', label: '双重编码' },
        { value: 'unicode', label: 'Unicode编码' },
        { value: 'truncate', label: '截断' },
        { value: 'dotsemicolon', label: '点分号' },
      ],
    },
  ],
  exampleInput: '/etc/passwd',
} satisfies ToolDefinition;
