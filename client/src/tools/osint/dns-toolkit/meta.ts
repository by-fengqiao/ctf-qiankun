import type { ToolDefinition } from '../../types';
export default {
  id: 'dns-toolkit',
  name: 'DNS 记录查询生成器',
  description: '生成 dig/nslookup/host 命令与在线查询链接（A/AAAA/MX/NS/TXT/SOA/CNAME/SPF/DKIM/DMARC/CAA）',
  category: 'osint',
  group: '网络',
  keywords: ['dns', 'dig', 'nslookup', 'host', 'mx', 'ns', 'txt', 'spf', 'dkim', 'dmarc', 'caa', '记录'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'example.com',
  defaultParams: { dkim_selector: 'default' },
} satisfies ToolDefinition;
