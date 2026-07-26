import type { ToolDefinition } from '../../types';

export default {
  id: 'evtx-parser',
  name: 'Windows事件日志解析',
  description: '解析 EVTX 事件日志文件，提取事件ID、时间戳、来源、通道、计算机名等信息',
  category: 'forensics',
  group: 'Windows',
  keywords: ['evtx', 'windows事件', 'event log', '事件日志', 'ElfFile', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '456C6646696C65003000010003000000...',
} satisfies ToolDefinition;
