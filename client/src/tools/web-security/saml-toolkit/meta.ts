import type { ToolDefinition } from '../../types';

export default {
  id: 'saml-toolkit',
  name: 'SAML工具',
  description: 'SAML Response 解码/修改/XXE注入/签名包装攻击',
  category: 'web-security',
  group: '认证/会话',
  keywords: ['saml', 'sso', 'saml response', 'assertion', 'xxe', 'signature wrapping', 'xml'],
  modes: ['execute'],
  paramsConfig: [
    {
      name: 'mode',
      label: '模式',
      type: 'select',
      default: 'decode',
      options: [
        { value: 'decode', label: '解码' },
        { value: 'modify', label: '修改' },
        { value: 'xxe', label: 'XXE注入' },
        { value: 'signature-wrapping', label: '签名包装' },
      ],
    },
  ],
  exampleInput: 'PHNhbWxwOlJlc3BvbnNl... (Base64 SAML Response)',
} satisfies ToolDefinition;
