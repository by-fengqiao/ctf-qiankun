import type { ToolDefinition, ToolEntry, CategoryConfig, ToolCategory } from './types';
import { allToolDefinitions } from './meta-manifest';
import { pinyin } from 'pinyin-pro';

export const CATEGORIES: CategoryConfig[] = [
  { id: 'encoding', name: '编码与文本转换', description: 'Base 系列、URL 编解码、字符编码、进制转换等', icon: 'Binary', color: 'blue' },
  { id: 'text-processing', name: '文本处理与开发辅助', description: '文本排序、格式化、正则、UUID、密码生成等', icon: 'FileText', color: 'gray' },
  { id: 'classical-crypto', name: '古典密码', description: '凯撒、维吉尼亚、摩斯、栅栏等古典密码', icon: 'Lock', color: 'amber' },
  { id: 'hash-crypto', name: '哈希与密码学辅助', description: 'MD5、SHA、CRC、HMAC、JWT、XOR 等', icon: 'Fingerprint', color: 'purple' },
  { id: 'modern-crypto', name: '现代密码学', description: 'RSA、AES、DES、ECC、数论、格密码等现代密码分析与攻击', icon: 'KeyRound', color: 'indigo' },
  { id: 'web-network', name: 'Web与网络数据', description: 'Cookie、HTTP Header、IP、CIDR、时间戳等', icon: 'Globe', color: 'cyan' },
  { id: 'web-security', name: 'Web安全', description: 'SQL注入、XSS、SSTI、JWT伪造、反序列化、WAF绕过等', icon: 'ShieldAlert', color: 'red' },
  { id: 'file-binary', name: '文件与二进制分析', description: '文件哈希、Hex 查看、字符串提取、熵分析等', icon: 'FileCode', color: 'orange' },
  { id: 'image-audio', name: '图片音频与隐写', description: '通道拆分、LSB、二维码、WAV 解析等', icon: 'Image', color: 'green' },
  { id: 'pwn-reverse', name: 'PWN与逆向', description: 'ELF/PE解析、汇编反汇编、ROP、格式化字符串、堆利用等', icon: 'Bug', color: 'rose' },
  { id: 'forensics', name: '取证', description: 'PCAP分析、内存提取、磁盘解析、注册表、文件雕刻等', icon: 'Search', color: 'teal' },
  { id: 'osint', name: 'OSINT', description: '邮件头解析、Google Dork、EXIF定位、用户名枚举等', icon: 'Radar', color: 'sky' },
  { id: 'stego', name: '隐写分析', description: '音频频谱、SSTV、摩斯电码、DTMF、二维码、位平面、直方图、噪声分析等隐写工具', icon: 'Eye', color: 'lime' },
  { id: 'misc', name: 'Misc工具', description: 'IEEE754、JS沙箱、密码破解、Punycode、UUencode、SNOW隐写等杂项工具', icon: 'Wrench', color: 'stone' },
  { id: 'general', name: '通用安全工具', description: 'YARA、Sigma、Snort规则生成、Wireshark过滤器、协议校验和等', icon: 'Shield', color: 'emerald' },
  { id: 'misc-esoteric', name: 'Misc与深奥语言', description: 'Brainfuck、Ook、Emoji 编码、佛曰等', icon: 'Sparkles', color: 'violet' },
];

const toolComponentLoaders = import.meta.glob<{ default: unknown }>('./**/ToolComponent.tsx');

const registry: Map<string, ToolEntry> = new Map();

for (const definition of allToolDefinitions) {
  const componentPath = `./${definition.category}/${definition.id}/ToolComponent.tsx`;
  const loader = toolComponentLoaders[componentPath];
  if (loader) {
    registry.set(definition.id, { definition, componentLoader: loader as ToolEntry['componentLoader'] });
  }
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(registry.values()).map((v) => v.definition);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getAllTools().filter((t) => t.category === category);
}

const searchIndexCache: Map<string, string> = new Map();

function buildSearchIndex(): void {
  if (searchIndexCache.size > 0) return;
  for (const tool of allToolDefinitions) {
    const parts = [
      tool.id,
      tool.name,
      tool.keywords.join(' '),
      pinyin(tool.name, { toneType: 'none', type: 'array' }).join(''),
      pinyin(tool.name, { toneType: 'none', type: 'array' }).map((s: string) => s[0]).join(''),
    ];
    searchIndexCache.set(tool.id, parts.join(' ').toLowerCase());
  }
}

export function searchTools(query: string): ToolDefinition[] {
  if (!query.trim()) return getAllTools();
  buildSearchIndex();
  const lower = query.toLowerCase().trim();
  const queryPinyin = pinyin(lower, { toneType: 'none', type: 'array' }).join('');
  const queryPinyinInitials = pinyin(lower, { toneType: 'none', type: 'array' }).map((s: string) => s[0]).join('');
  const all = getAllTools();
  return all.filter((t) => {
    const idx = searchIndexCache.get(t.id);
    if (!idx) return false;
    return idx.includes(lower) || (queryPinyin && idx.includes(queryPinyin)) || (queryPinyinInitials && idx.includes(queryPinyinInitials));
  });
}

export function getToolEntry(toolId: string): ToolEntry | undefined {
  return registry.get(toolId);
}

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return registry.get(toolId)?.definition;
}

export function getCategoryConfig(category: ToolCategory): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === category);
}

export function getToolCount(): number {
  return registry.size;
}
