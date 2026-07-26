import type { ToolDefinition } from '../../types';

export default {
  id: 'pcap-analyzer',
  name: 'PCAP流量分析',
  description: '解析 PCAP 抓包文件，提取 TCP 流、HTTP 请求/响应、DNS 查询，统计协议分布与时间线',
  category: 'forensics',
  group: '流量',
  keywords: ['pcap', '流量分析', 'network', 'tcp', 'http', 'dns', 'wireshark', 'tcpdump', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'd4c3b2a1020004000000000000000000ffff000001000000...',
} satisfies ToolDefinition;
