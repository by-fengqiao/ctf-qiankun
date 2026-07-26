import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

const stripReaderMsg = (hex: string): string => {
  const idx = hex.indexOf('\n\n(');
  return idx >= 0 ? hex.substring(0, idx) : hex;
};

interface PackerSignature {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  suggestion: string;
  patterns: { bytes: number[]; description?: string }[];
}

const PACKER_SIGNATURES: PackerSignature[] = [
  {
    name: 'UPX',
    confidence: 'high',
    suggestion: '使用 upx -d <file> 脱壳',
    patterns: [
      { bytes: [0x55, 0x50, 0x58, 0x21], description: 'UPX 魔数 (UPX!)' },
      { bytes: [0x55, 0x50, 0x58, 0x30], description: 'UPX0 节区' },
      { bytes: [0x55, 0x50, 0x58, 0x31], description: 'UPX1 节区' },
      { bytes: [0x55, 0x50, 0x58, 0x32], description: 'UPX2 节区' },
    ],
  },
  {
    name: 'Themida',
    confidence: 'high',
    suggestion: '使用 Themida dumper / ollydump 工具脱壳',
    patterns: [
      { bytes: [0x2e, 0x74, 0x68, 0x65, 0x6d, 0x69, 0x64, 0x61], description: '.themida 节区' },
    ],
  },
  {
    name: 'VMProtect',
    confidence: 'high',
    suggestion: '使用 VMP dumper 工具脱壳',
    patterns: [
      { bytes: [0x2e, 0x76, 0x6d, 0x70, 0x30], description: '.vmp0 节区' },
      { bytes: [0x2e, 0x76, 0x6d, 0x70, 0x31], description: '.vmp1 节区' },
    ],
  },
  {
    name: 'ASPack',
    confidence: 'high',
    suggestion: '使用 ASPack 专用脱壳工具',
    patterns: [
      { bytes: [0x2e, 0x61, 0x73, 0x70, 0x61, 0x63, 0x6b], description: '.aspack 节区' },
    ],
  },
  {
    name: 'PECompact',
    confidence: 'high',
    suggestion: '使用 PECompact 专用脱壳工具',
    patterns: [
      { bytes: [0x50, 0x45, 0x43, 0x32], description: 'PEC2 节区' },
    ],
  },
  {
    name: 'MPRESS',
    confidence: 'high',
    suggestion: '使用 MPRESS 专用脱壳工具',
    patterns: [
      { bytes: [0x4d, 0x50, 0x52, 0x45, 0x53, 0x53, 0x31], description: 'MPRESS1 节区' },
      { bytes: [0x4d, 0x50, 0x52, 0x45, 0x53, 0x53, 0x32], description: 'MPRESS2 节区' },
    ],
  },
  {
    name: 'NSPack',
    confidence: 'high',
    suggestion: '使用 NSPack 专用脱壳工具',
    patterns: [
      { bytes: [0x2e, 0x6e, 0x73, 0x70, 0x30], description: '.nsp0 节区' },
      { bytes: [0x2e, 0x6e, 0x73, 0x70, 0x31], description: '.nsp1 节区' },
    ],
  },
  {
    name: 'FSG',
    confidence: 'high',
    suggestion: '使用 FSG 专用脱壳工具',
    patterns: [{ bytes: [0x46, 0x53, 0x47, 0x21], description: 'FSG! 签名' }],
  },
  {
    name: 'PyInstaller',
    confidence: 'high',
    suggestion: '使用 pyinstxtractor 解包，然后反编译 pyc',
    patterns: [
      { bytes: [0x4d, 0x45, 0x49, 0x0c], description: 'MEI 标记' },
      { bytes: [0x50, 0x59, 0x5a, 0x2d], description: 'PYZ 归档标记' },
    ],
  },
  {
    name: '.NET',
    confidence: 'high',
    suggestion: '使用 dnSpy / ILSpy / dotPeek 反编译',
    patterns: [
      { bytes: [0x6d, 0x73, 0x63, 0x6f, 0x72, 0x65, 0x65, 0x2e, 0x64, 0x6c, 0x6c], description: 'mscoree.dll 导入' },
      { bytes: [0x5f, 0x43, 0x6f, 0x72, 0x45, 0x78, 0x65, 0x4d, 0x61, 0x69, 0x6e], description: '_CorExeMain 导入' },
    ],
  },
  {
    name: 'Go',
    confidence: 'medium',
    suggestion: '使用 IDA + GoReSym 还复符号，或使用 redress 分析',
    patterns: [
      { bytes: [0x47, 0x6f, 0x20, 0x62, 0x75, 0x69, 0x6c, 0x64, 0x20, 0x49, 0x44], description: 'Go build ID' },
      { bytes: [0xff, 0x20, 0x47, 0x6f], description: 'Go 运行时标记' },
    ],
  },
  {
    name: 'Enigma',
    confidence: 'medium',
    suggestion: '使用 Enigma dumper 工具',
    patterns: [{ bytes: [0x45, 0x6e, 0x69, 0x67, 0x6d, 0x61], description: 'Enigma 标记' }],
  },
  {
    name: 'MEW',
    confidence: 'high',
    suggestion: '使用 MEW 专用脱壳工具',
    patterns: [{ bytes: [0x4d, 0x45, 0x57], description: 'MEW 签名' }],
  },
  {
    name: 'NPack',
    confidence: 'medium',
    suggestion: '使用 NPack 专用脱壳工具',
    patterns: [{ bytes: [0x4e, 0x50, 0x61, 0x63, 0x6b], description: 'NPack 标记' }],
  },
  {
    name: 'Yoda\'s Protector',
    confidence: 'medium',
    suggestion: '使用 Yoda 专用脱壳工具',
    patterns: [{ bytes: [0x79, 0x43], description: 'yC 标记' }],
  },
];

const findPattern = (bytes: Uint8Array, pattern: number[], startOffset: number): number => {
  for (let i = startOffset; i <= bytes.length - pattern.length; i++) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
};

const detectPackers = (bytes: Uint8Array): { sig: PackerSignature; offset: number; desc?: string }[] => {
  const found: { sig: PackerSignature; offset: number; desc?: string }[] = [];
  for (const sig of PACKER_SIGNATURES) {
    for (const pat of sig.patterns) {
      let off = findPattern(bytes, pat.bytes, 0);
      while (off >= 0) {
        found.push({ sig, offset: off, desc: pat.description });
        off = findPattern(bytes, pat.bytes, off + pat.bytes.length);
      }
    }
  }
  found.sort((a, b) => a.offset - b.offset);
  return found;
};

const detectFileType = (bytes: Uint8Array): string => {
  if (bytes.length < 4) return '未知';
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) return 'PE (Windows 可执行文件)';
  if (
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    return 'ELF (Linux 可执行文件)';
  }
  if (
    bytes[0] === 0x64 &&
    bytes[1] === 0x65 &&
    bytes[2] === 0x78 &&
    bytes[3] === 0x0a
  ) {
    return 'DEX (Android Dalvik 可执行文件)';
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return 'ZIP / APK / JAR';
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c) return 'ELF';
  return '未知 / 原始二进制';
};

const analyzePackers = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  壳识别报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  L.push('── 文件信息 ──');
  L.push(`  文件类型: ${detectFileType(bytes)}`);
  L.push(`  扫描大小: ${bytes.length} 字节`);
  L.push('');

  const matches = detectPackers(bytes);
  if (matches.length === 0) {
    L.push('── 识别结果 ──');
    L.push('  未识别到常见壳特征。');
    L.push('  可能的情况:');
    L.push('    • 程序未加壳');
    L.push('    • 使用了自定义 / 少见壳');
    L.push('    • 输入数据不足或不是 PE/ELF 文件');
    L.push('');
    L.push('── 建议 ──');
    L.push('  1. 使用 DIE (Detect It Easy) 进一步分析');
    L.push('  2. 使用 strings / PEiD / Exeinfo PE 交叉验证');
    L.push('  3. 检查熵值，高熵区域可能是加密/压缩段');
    return L.join('\n');
  }

  // Deduplicate by packer name and compute score
  const nameToBest = new Map<string, { sig: PackerSignature; offsets: number[]; descs: string[] }>();
  for (const m of matches) {
    const existing = nameToBest.get(m.sig.name);
    if (existing) {
      existing.offsets.push(m.offset);
      if (m.desc) existing.descs.push(m.desc);
    } else {
      nameToBest.set(m.sig.name, { sig: m.sig, offsets: [m.offset], descs: m.desc ? [m.desc] : [] });
    }
  }

  L.push('── 识别结果 ──');
  for (const entry of nameToBest.values()) {
    const uniqueDescs = Array.from(new Set(entry.descs));
    L.push(`  [${entry.sig.confidence === 'high' ? '高' : entry.sig.confidence === 'medium' ? '中' : '低'}置信度] ${entry.sig.name}`);
    L.push(`    匹配特征: ${uniqueDescs.join(', ') || '字节签名'}`);
    L.push(`    命中位置: ${entry.offsets.map((o) => `0x${o.toString(16)}`).join(', ')}`);
    L.push(`    脱壳建议: ${entry.sig.suggestion}`);
    L.push('');
  }

  L.push('── 详细匹配列表 ──');
  matches.forEach((m) => {
    L.push(
      `  0x${m.offset.toString(16).padStart(8, '0')}  ${m.sig.name}  ${m.desc ?? ''}`,
    );
  });

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="壳识别器"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file: File | null,
    ) => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 4 * 1024);
      }
      const hexOnly: string = stripReaderMsg(hexData);
      const bytes: Uint8Array = parseHex(hexOnly);
      return analyzePackers(bytes);
    }}
  />
);
export default ToolComponent;
