import type { ToolDefinition } from '../../types';

export default {
  id: 'upload-bypass',
  name: '文件上传绕过',
  description: '生成文件上传绕过 payload，覆盖扩展名/MIME/魔术字节/图片检查/WAF 等场景',
  category: 'web-security',
  group: '文件/路径',
  keywords: ['文件上传', 'upload bypass', 'webshell', 'php', 'phtml', 'htaccess', '绕过', 'mime'],
  modes: ['generate'],
  paramsConfig: [
    {
      name: 'limit',
      label: '限制类型',
      type: 'select',
      default: 'extension',
      options: [
        { value: 'extension', label: '扩展名检查' },
        { value: 'mime', label: 'MIME检查' },
        { value: 'magic-bytes', label: '魔术字节' },
        { value: 'image-check', label: '图片检查' },
        { value: 'waf', label: 'WAF' },
      ],
    },
  ],
  exampleInput: 'shell.php',
} satisfies ToolDefinition;
