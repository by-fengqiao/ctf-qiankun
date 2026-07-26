import type { ToolDefinition } from '../../types';
export default {
  id: 'asn-lookup',
  name: 'ASN 查询',
  description: '生成 ASN 查询链接，内置常见云厂商 ASN 信息',
  category: 'osint',
  group: '网络',
  keywords: ['asn', 'bgp', '自治系统', 'asn', '云厂商', 'bgp.he.net', 'ripe', 'arin'],
  modes: ['analyze'],
  hasFileInput: false,
  exampleInput: 'AS13335',
} satisfies ToolDefinition;
