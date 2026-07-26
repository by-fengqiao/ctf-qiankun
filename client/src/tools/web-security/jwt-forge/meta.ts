import type { ToolDefinition } from '../../types';

export default {
  id: 'jwt-forge',
  name: 'JWT伪造工具',
  description: '解析并伪造 JWT：修改 claims、alg=none、弱密钥爆破、RS256-HMAC 混淆',
  category: 'web-security',
  group: '认证/会话',
  keywords: ['jwt', 'json web token', 'token forge', 'alg none', 'rs256 confusion', 'weak key'],
  modes: ['execute'],
  exampleInput: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWRlbnRpdHkiOiJ1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  defaultParams: { mode: 'alg-none', key: '', claim: 'identity=admin', alg: 'HS256' },
} satisfies ToolDefinition;
