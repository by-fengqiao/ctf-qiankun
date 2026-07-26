import type { ToolDefinition } from '../../types';

export default {
  id: 'wireshark-filter',
  name: 'Wireshark 过滤器生成器',
  description: '生成 Wireshark 显示过滤器或 BPF 捕获过滤器',
  category: 'general',
  group: '工具',
  keywords: ['wireshark', 'filter', 'display', 'capture', 'bpf', 'tcpdump', '过滤器'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'ip.addr==192.168.1.1\ntcp.port==80',
  defaultParams: { filter_type: 'display', protocol: 'tcp' },
} satisfies ToolDefinition;
