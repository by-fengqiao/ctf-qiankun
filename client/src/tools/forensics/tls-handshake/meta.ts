import type { ToolDefinition } from '../../types';

export default {
  id: 'tls-handshake',
  name: 'TLS握手解析',
  description: '解析 TLS 记录层与握手协议（ClientHello/ServerHello/Certificate/ServerKeyExchange），提取版本、密码套件、SNI、证书链与密钥交换参数',
  category: 'forensics',
  group: '流量',
  keywords: ['tls', 'ssl', '握手', 'handshake', 'clienthello', 'serverhello', '证书', 'certificate', 'sni', 'forensics'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '16030100',
} satisfies ToolDefinition;
