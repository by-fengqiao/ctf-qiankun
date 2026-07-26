import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

const stripReaderMsg = (hex: string): string => {
  const idx = hex.indexOf('\n\n(');
  return idx >= 0 ? hex.substring(0, idx) : hex;
};

interface PltEntry {
  pltOffset: number;
  relocIndex: number;
  gotAddr: bigint;
  pushImm: number;
}

const readU32 = (bytes: Uint8Array, off: number, le: boolean): number => {
  if (off + 4 > bytes.length) return 0;
  const a = le ? bytes[off] : bytes[off + 3];
  const b = le ? bytes[off + 1] : bytes[off + 2];
  const c = le ? bytes[off + 2] : bytes[off + 1];
  const d = le ? bytes[off + 3] : bytes[off];
  return (a | (b << 8) | (c << 16) | (d << 24)) >>> 0;
};

const hexStr = (val: bigint | number): string => '0x' + val.toString(16);

const isElf = (bytes: Uint8Array): boolean =>
  bytes.length >= 5 &&
  bytes[0] === 0x7f &&
  bytes[1] === 0x45 &&
  bytes[2] === 0x4c &&
  bytes[3] === 0x46;

interface ElfInfo {
  is64: boolean;
  le: boolean;
}

const detectElf = (bytes: Uint8Array): ElfInfo => {
  if (!isElf(bytes)) return { is64: true, le: true };
  const eiClass = bytes[4];
  const eiData = bytes[5];
  return { is64: eiClass === 2, le: eiData === 1 };
};

/**
 * 扫描 PLT stub。
 * 典型 x86/x64 PLT[n] (n>=1) 结构:
 *   FF 25 <disp32>   ; jmp [GOT entry]        (6 字节)
 *   68 <imm32>       ; push reloc_index       (5 字节)
 *   E9 <rel32>       ; jmp PLT[0]             (5 字节)
 * 共 16 字节。
 * x86: <disp32> 为 GOT 绝对地址。
 * x64: <disp32> 为 RIP 相对偏移, GOT = (stub+6) + disp32。
 */
const scanPltStubs = (
  bytes: Uint8Array,
  info: ElfInfo,
): PltEntry[] => {
  const entries: PltEntry[] = [];
  const seen = new Set<number>();
  const minLen = 16;
  for (let i = 0; i + minLen <= bytes.length; i++) {
    // jmp [mem]: FF 25
    if (bytes[i] !== 0xff || bytes[i + 1] !== 0x25) continue;
    // push imm32: 68
    if (bytes[i + 6] !== 0x68) continue;
    // jmp rel32: E9
    if (bytes[i + 11] !== 0xe9) continue;

    const disp = readU32(bytes, i + 2, info.le);
    const pushImm = readU32(bytes, i + 7, info.le);

    let gotAddr: bigint;
    if (info.is64) {
      // RIP-relative: 下一条指令地址 = i + 6
      gotAddr = BigInt(i + 6) + BigInt(disp);
    } else {
      // 绝对地址
      gotAddr = BigInt(disp);
    }

    const key = i;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      pltOffset: i,
      relocIndex: pushImm >>> 0,
      gotAddr,
      pushImm,
    });
  }
  return entries;
};

const renderPltTable = (
  entries: PltEntry[],
  info: ElfInfo,
  totalLen: number,
): string => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════════════════════');
  L.push('  GOT / PLT 延迟绑定映射表');
  L.push(`  架构: ${info.is64 ? 'x86-64' : 'x86 (32位)'} · 端序: ${info.le ? '小端' : '大端'}`);
  L.push('═══════════════════════════════════════════════════════════');
  L.push('');

  if (entries.length === 0) {
    L.push('未检测到 PLT stub。');
    L.push('');
    L.push('提示:');
    L.push('  • 确保输入包含 .plt 节区字节 (含 FF 25 ... 68 ... E9 ... 序列)。');
    L.push('  • 完整 ELF 文件可直接上传; 也可粘贴 .plt + .got.plt 的十六进制。');
    L.push('  • 本工具仅做模式扫描, 不解析符号表, 函数名以 reloc 索引标注。');
    return L.join('\n');
  }

  L.push(
    '序号  PLT偏移       重定位索引    GOT地址',
  );
  L.push('─'.repeat(56));
  entries.forEach((e, idx) => {
    L.push(
      String(idx).padStart(4) +
        '  ' +
        hexStr(e.pltOffset).padStart(10) +
        '    ' +
        String(e.relocIndex).padStart(8) +
        '     ' +
        hexStr(e.gotAddr).padStart(12),
    );
  });
  L.push('');

  // function → PLT → GOT 映射 (按 reloc 索引)
  L.push('───────────────────────────────────────────────────────────');
  L.push('  函数 → PLT 地址 → GOT 地址');
  L.push('───────────────────────────────────────────────────────────');
  entries.forEach((e, idx) => {
    const fnName = `func@plt_${e.relocIndex}`;
    L.push(
      `${fnName.padEnd(18)} PLT=${hexStr(e.pltOffset)}  GOT=${hexStr(e.gotAddr)}`,
    );
  });
  L.push('');

  L.push(`共扫描 ${totalLen} 字节, 识别 ${entries.length} 个 PLT stub。`);
  L.push('');
  L.push('说明:');
  L.push('  • GOT 地址 = 该函数在 .got.plt 中的表项地址, 首次调用前指向 PLT[1] (push+jmp)。');
  L.push('  • 重定位索引 = PLT stub 中 push 的 .rel.plt 索引, 用于反查符号名。');
  L.push('  • 欲获取函数名, 需结合 .dynsym + .dynstr 解析 (可使用 elf-parser 工具)。');
  return L.join('\n');
};

const analyze = (hexInput: string): string => {
  const raw = stripReaderMsg(hexInput.trim());
  if (!raw) {
    return '请输入 ELF 文件的十六进制数据, 或上传 ELF 二进制文件。';
  }
  let bytes: Uint8Array;
  try {
    bytes = parseHex(raw);
  } catch {
    return '错误: 无法解析十六进制数据, 请确认输入为有效 hex 字符串。';
  }
  if (bytes.length < 16) {
    return '错误: 数据过短 (少于 16 字节), 无法扫描 PLT stub。';
  }
  const info = detectElf(bytes);
  const entries = scanPltStubs(bytes, info);
  return renderPltTable(entries, info, bytes.length);
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="GOT/PLT计算器"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ): Promise<string> => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file);
      }
      return analyze(hex);
    }}
  />
);
export default ToolComponent;
