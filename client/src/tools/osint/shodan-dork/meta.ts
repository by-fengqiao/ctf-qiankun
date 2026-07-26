import type { ToolDefinition } from '../../types';
export default {
  id: 'shodan-dork',
  name: 'Shodan/Censys/FOFA Dork 生成器',
  description: '根据目标生成多平台搜索语法（Shodan/Censys/FOFA/ZoomEye）',
  category: 'osint',
  group: '网络',
  keywords: ['shodan', 'censys', 'fofa', 'zoomeye', 'dork', '设备搜索', 'iot', '搜索语法'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'apache',
  defaultParams: { platform: 'shodan' },
} satisfies ToolDefinition;
