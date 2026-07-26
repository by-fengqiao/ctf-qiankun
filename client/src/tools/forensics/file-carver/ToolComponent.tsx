import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Magic signatures ---------- */

interface MagicSig {
  type: string;
  ext: string;
  mime: string;
  magic: number[];
}

const MAGIC_SIGS: MagicSig[] = [
  { type: 'PNG', ext: 'png', mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'JPEG', ext: 'jpg', mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { type: 'GIF', ext: 'gif', mime: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
  { type: 'PDF', ext: 'pdf', mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  { type: 'ZIP', ext: 'zip', mime: 'application/zip', magic: [0x50, 0x4b, 0x03, 0x04] },
  { type: 'GZIP', ext: 'gz', mime: 'application/gzip', magic: [0x1f, 0x8b] },
  { type: 'ELF', ext: 'elf', mime: 'application/octet-stream', magic: [0x7f, 0x45, 0x4c, 0x46] },
  { type: 'PE', ext: 'exe', mime: 'application/x-msdownload', magic: [0x4d, 0x5a] },
];

const PNG_FOOTER = [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
const PDF_EOF = [0x25, 0x25, 0x45, 0x4f, 0x46];
const ZIP_EOCD = [0x50, 0x4b, 0x05, 0x06];

/* ---------- Helpers ---------- */

function matchAt(bytes: Uint8Array, offset: number, sig: number[]): boolean {
  if (offset + sig.length > bytes.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

function findNextMagic(bytes: Uint8Array, start: number): number {
  for (let i = start; i < bytes.length; i++) {
    for (const sig of MAGIC_SIGS) {
      if (matchAt(bytes, i, sig.magic)) return i;
    }
  }
  return bytes.length;
}

function findFileEnd(bytes: Uint8Array, type: string, start: number): number {
  const nextMag = findNextMagic(bytes, start + 4);
  if (type === 'PNG') {
    for (let i = start + 8; i + PNG_FOOTER.length <= bytes.length; i++) {
      if (matchAt(bytes, i, PNG_FOOTER)) return i + PNG_FOOTER.length;
    }
    return nextMag;
  }
  if (type === 'JPEG') {
    for (let i = start + 3; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return i + 2;
    }
    return nextMag;
  }
  if (type === 'GIF') {
    for (let i = start + 6; i < bytes.length; i++) {
      if (bytes[i] === 0x3b) return i + 1;
    }
    return nextMag;
  }
  if (type === 'PDF') {
    for (let i = start + 4; i + PDF_EOF.length <= bytes.length; i++) {
      if (matchAt(bytes, i, PDF_EOF)) return i + PDF_EOF.length;
    }
    return nextMag;
  }
  if (type === 'ZIP') {
    for (let i = start + 4; i + ZIP_EOCD.length <= bytes.length; i++) {
      if (matchAt(bytes, i, ZIP_EOCD)) return i + 22;
    }
    return nextMag;
  }
  return nextMag;
}

function bytesToBase64(bytes: Uint8Array, start: number, end: number): string {
  const slice = bytes.subarray(start, end);
  const parts: string[] = [];
  const chunk = 8192;
  for (let i = 0; i < slice.length; i += chunk) {
    const part = slice.subarray(i, Math.min(i + chunk, slice.length));
    let str = '';
    for (let j = 0; j < part.length; j++) {
      str += String.fromCharCode(part[j]);
    }
    parts.push(str);
  }
  return btoa(parts.join(''));
}

interface CarvedFile {
  type: string;
  ext: string;
  mime: string;
  offset: number;
  size: number;
}

function carveFiles(bytes: Uint8Array): CarvedFile[] {
  const found: boolean[] = new Array(bytes.length).fill(false);
  const files: CarvedFile[] = [];
  for (const sig of MAGIC_SIGS) {
    for (let i = 0; i <= bytes.length - sig.magic.length; i++) {
      if (found[i]) continue;
      if (matchAt(bytes, i, sig.magic)) {
        const end = findFileEnd(bytes, sig.type, i);
        if (end > i + sig.magic.length) {
          files.push({ type: sig.type, ext: sig.ext, mime: sig.mime, offset: i, size: end - i });
          for (let j = i; j < end && j < bytes.length; j++) found[j] = true;
        }
      }
    }
  }
  files.sort((a: CarvedFile, b: CarvedFile) => a.offset - b.offset);
  return files;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 4) throw new Error('数据过短，至少需要 4 字节');
  const files = carveFiles(bytes);
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  文件雕刻报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push(`扫描数据大小: ${bytes.length} 字节`);
  L.push(`找到内嵌文件: ${files.length} 个`);
  L.push('');

  if (files.length === 0) {
    L.push('未找到任何已知文件签名。');
    L.push('支持签名: PNG, JPEG, GIF, PDF, ZIP, GZIP, ELF, PE(MZ)');
    return L.join('\n');
  }

  const MAX_B64 = 8192;
  files.forEach((f: CarvedFile, idx: number) => {
    const num = idx + 1;
    L.push(`── [${num}] ${f.type} ──`);
    L.push(`  偏移:   0x${f.offset.toString(16).toUpperCase()} (${f.offset})`);
    L.push(`  大小:   ${f.size} 字节`);
    L.push(`  前16字节: ${bytesToHex(bytes, f.offset, Math.min(f.offset + 16, f.offset + f.size))}`);
    if (f.size <= MAX_B64) {
      const b64 = bytesToBase64(bytes, f.offset, f.offset + f.size);
      L.push(`  下载链接:`);
      L.push(`  data:${f.mime};base64,${b64}`);
    } else {
      L.push(`  (文件过大 ${f.size} 字节，仅显示前 ${MAX_B64} 字节的 Base64)`);
      const b64 = bytesToBase64(bytes, f.offset, f.offset + MAX_B64);
      L.push(`  data:${f.mime};base64,${b64}...`);
    }
    L.push('');
  });

  L.push('── 摘要 ──');
  L.push(`  PNG:  ${files.filter((f: CarvedFile) => f.type === 'PNG').length} 个`);
  L.push(`  JPEG: ${files.filter((f: CarvedFile) => f.type === 'JPEG').length} 个`);
  L.push(`  GIF:  ${files.filter((f: CarvedFile) => f.type === 'GIF').length} 个`);
  L.push(`  PDF:  ${files.filter((f: CarvedFile) => f.type === 'PDF').length} 个`);
  L.push(`  ZIP:  ${files.filter((f: CarvedFile) => f.type === 'ZIP').length} 个`);
  L.push(`  GZIP: ${files.filter((f: CarvedFile) => f.type === 'GZIP').length} 个`);
  L.push(`  ELF:  ${files.filter((f: CarvedFile) => f.type === 'ELF').length} 个`);
  L.push(`  PE:   ${files.filter((f: CarvedFile) => f.type === 'PE').length} 个`);
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="文件雕刻"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 2 * 1024 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
