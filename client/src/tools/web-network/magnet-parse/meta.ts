import type { ToolDefinition } from '../../types';

export default {
  id: 'magnet-parse',
  name: 'Magnet 链接解析',
  category: 'web-network',
  group: '其他',
  keywords: ['magnet', 'uri', 'bt', 'torrent', '磁力', '解析'],
  modes: ['analyze'],
  exampleInput:
    'magnet:?xt=urn:btih:abcdef1234567890&dn=testfile.iso&tr=udp://tracker.example.com:1337',
} satisfies ToolDefinition;
