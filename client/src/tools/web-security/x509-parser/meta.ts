import type { ToolDefinition } from '../../types';

export default {
  id: 'x509-parser',
  name: 'X.509证书解析',
  description: '解析 X.509 证书，提取 TBSCertificate/扩展/公钥等信息',
  category: 'web-security',
  group: '认证/会话',
  keywords: ['x509', '证书', 'certificate', 'pem', 'der', 'tls', 'ssl', 'public key', 'asn1'],
  modes: ['analyze'],
  exampleInput: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----',
} satisfies ToolDefinition;
