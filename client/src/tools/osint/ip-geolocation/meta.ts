import type { ToolDefinition } from '../../types';
export default {
  id: 'ip-geolocation',
  name: 'IP 地理定位',
  description: '内置私有/保留 IP 段识别，公网 IP 生成多平台查询链接',
  category: 'osint',
  group: '网络',
  keywords: ['ip', 'geo', 'geolocation', '地理位置', 'asn', 'cidr', '私有地址', 'ipinfo'],
  modes: ['analyze'],
  hasFileInput: false,
  exampleInput: '8.8.8.8',
} satisfies ToolDefinition;
