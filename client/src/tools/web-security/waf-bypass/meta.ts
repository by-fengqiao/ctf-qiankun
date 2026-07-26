import type { ToolDefinition } from '../../types';

export default {
  id: 'waf-bypass',
  name: 'WAF绕过策略',
  description: '生成 WAF 绕过 payload，支持 ModSecurity/Cloudflare/AWS/阿里云/腾讯云等',
  category: 'web-security',
  group: '其他',
  keywords: ['waf', 'bypass', 'modsecurity', 'cloudflare', 'aws waf', '阿里云', '腾讯云', '绕过'],
  modes: ['generate'],
  paramsConfig: [
    {
      name: 'waf',
      label: 'WAF',
      type: 'select',
      default: '通用',
      options: [
        { value: 'ModSecurity', label: 'ModSecurity' },
        { value: 'Cloudflare', label: 'Cloudflare' },
        { value: 'AWS-WAF', label: 'AWS WAF' },
        { value: '阿里云', label: '阿里云' },
        { value: '腾讯云', label: '腾讯云' },
        { value: '通用', label: '通用' },
      ],
    },
    {
      name: 'attack',
      label: '攻击类型',
      type: 'select',
      default: 'SQLi',
      options: [
        { value: 'SQLi', label: 'SQL注入' },
        { value: 'XSS', label: 'XSS' },
        { value: 'path-traversal', label: '路径穿越' },
        { value: 'cmdi', label: '命令注入' },
      ],
    },
  ],
  exampleInput: '1 OR 1=1',
} satisfies ToolDefinition;
