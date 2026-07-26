import type { ToolDefinition } from '../../types';

export default {
  id: 'protocol-checksum',
  name: '协议校验和计算',
  description: '计算 IPv4/TCP/UDP/ICMP/CRC32/Adler32/Fletcher 校验和',
  category: 'general',
  group: '工具',
  keywords: ['checksum', 'crc', 'ipv4', 'tcp', 'udp', 'icmp', 'adler', 'fletcher', '校验和'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: '4500 003c 1c46 4000 4006 0000 baidu 0d22',
  defaultParams: { type: 'ipv4-header' },
} satisfies ToolDefinition;
