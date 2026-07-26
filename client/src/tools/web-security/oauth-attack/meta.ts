import type { ToolDefinition } from '../../types';

export default {
  id: 'oauth-attack',
  name: 'OAuth流程攻击',
  description: '生成 OAuth 流程攻击 payload，覆盖 redirect-uri/state/replay/token-leak/PKCE 等',
  category: 'web-security',
  group: '认证/会话',
  keywords: ['oauth', 'oauth2', 'oidc', 'redirect uri', 'state', 'pkce', 'token', '授权码', 'implicit'],
  modes: ['generate'],
  paramsConfig: [
    {
      name: 'vuln',
      label: '漏洞类型',
      type: 'select',
      default: 'redirect-uri-bypass',
      options: [
        { value: 'redirect-uri-bypass', label: 'Redirect URI 绕过' },
        { value: 'missing-state', label: '缺少 State' },
        { value: 'code-replay', label: '授权码重放' },
        { value: 'token-leak', label: 'Token 泄露' },
        { value: 'pkce-downgrade', label: 'PKCE 降级' },
        { value: 'implicit-flow', label: 'Implicit Flow' },
      ],
    },
  ],
  exampleInput: 'https://target.com/oauth/authorize',
} satisfies ToolDefinition;
