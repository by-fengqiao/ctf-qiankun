import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const GZIP_OS: Record<number, string> = {
  0: 'FAT filesystem',
  3: 'Unix',
  7: 'Mac OS',
  11: 'NTFS (Windows)',
  255: 'unknown',
};

function parseGzipHeader(bytes: Uint8Array): string {
  if (bytes.length < 10) {
    throw new Error('数据太短，gzip 头至少需要 10 字节');
  }
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    throw new Error('无效的 gzip 魔数 (期望 1F 8B)');
  }

  let pos = 0;
  let output = '=== Gzip 头部解析 ===\n\n';

  output += `魔数: ${bytes[0].toString(16).padStart(2, '0')} ${bytes[1].toString(16).padStart(2, '0').toUpperCase()}\n`;
  pos = 2;

  const method = bytes[pos++];
  output += `压缩方法: ${method}${method === 8 ? ' (DEFLATE)' : ' (未知)'}\n`;

  const flags = bytes[pos++];
  const ftext = (flags & 1) !== 0;
  const fhcrc = (flags & 2) !== 0;
  const fextra = (flags & 4) !== 0;
  const fname = (flags & 8) !== 0;
  const fcomment = (flags & 0x10) !== 0;
  output += `标志位: 0x${flags.toString(16).padStart(2, '0').toUpperCase()}\n`;
  output += `  FTEXT=${ftext ? 1 : 0} FHCRC=${fhcrc ? 1 : 0} FEXTRA=${fextra ? 1 : 0} FNAME=${fname ? 1 : 0} FCOMMENT=${fcomment ? 1 : 0}\n`;

  const mtime =
    bytes[pos] | (bytes[pos + 1] << 8) | (bytes[pos + 2] << 16) | (bytes[pos + 3] << 24);
  pos += 4;
  const date = mtime > 0 ? new Date(mtime * 1000).toUTCString() : '无';
  output += `修改时间: ${mtime} (${date})\n`;

  const xfl = bytes[pos++];
  output += `额外标志: ${xfl}${xfl === 2 ? ' (最大压缩)' : xfl === 4 ? ' (最快压缩)' : ''}\n`;

  const os = bytes[pos++];
  output += `操作系统: ${os} (${GZIP_OS[os] ?? '未知'})\n`;

  if (fextra && pos + 2 <= bytes.length) {
    const xlen = bytes[pos] | (bytes[pos + 1] << 8);
    pos += 2;
    output += `\n扩展字段:\n  长度: ${xlen}\n  数据: ${Array.from(bytes.subarray(pos, pos + Math.min(xlen, 32)))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join(' ')}${xlen > 32 ? '...' : ''}\n`;
    pos += xlen;
  }

  if (fname && pos < bytes.length) {
    let name = '';
    while (pos < bytes.length && bytes[pos] !== 0) {
      name += String.fromCharCode(bytes[pos++]);
    }
    pos++;
    output += `\n原始文件名: ${name}\n`;
  }

  if (fcomment && pos < bytes.length) {
    let comment = '';
    while (pos < bytes.length && bytes[pos] !== 0) {
      comment += String.fromCharCode(bytes[pos++]);
    }
    pos++;
    output += `\n注释: ${comment}\n`;
  }

  if (fhcrc && pos + 2 <= bytes.length) {
    const crc16 = bytes[pos] | (bytes[pos + 1] << 8);
    output += `\n头部CRC16: 0x${crc16.toString(16).padStart(4, '0').toUpperCase()}\n`;
    pos += 2;
  }

  output += `\n压缩数据起始偏移: ${pos} 字节\n`;
  output += `压缩数据长度: ${bytes.length - pos} 字节\n`;

  if (bytes.length >= 8) {
    const crc32 = (bytes[bytes.length - 8] | (bytes[bytes.length - 7] << 8) | (bytes[bytes.length - 6] << 16) | (bytes[bytes.length - 5] << 24)) >>> 0;
    const isize = bytes[bytes.length - 4] | (bytes[bytes.length - 3] << 8) | (bytes[bytes.length - 2] << 16) | (bytes[bytes.length - 1] << 24);
    output += `\n尾部校验:\n  CRC32: 0x${crc32.toString(16).padStart(8, '0').toUpperCase()}\n  ISIZE: ${isize} 字节 (解压后大小)\n`;
  }

  return output;
}

function parseZlibHeader(bytes: Uint8Array): string {
  if (bytes.length < 2) {
    throw new Error('数据太短，zlib 头至少需要 2 字节');
  }

  const cmf = bytes[0];
  const flg = bytes[1];

  const cm = cmf & 0x0f;
  const cinfo = (cmf >> 4) & 0x0f;
  const windowSize = Math.pow(2, cinfo + 8);

  const fcheck = flg & 0x1f;
  const fdict = (flg >> 5) & 1;
  const flevel = (flg >> 6) & 3;

  const check = (cmf * 256 + flg) % 31;

  let output = '=== Zlib 头部解析 ===\n\n';
  output += `CMF: 0x${cmf.toString(16).padStart(2, '0').toUpperCase()} (${cmf.toString(2).padStart(8, '0')})\n`;
  output += `  CM (压缩方法): ${cm}${cm === 8 ? ' (DEFLATE)' : ' (未知)'}\n`;
  output += `  CINFO (窗口大小信息): ${cinfo}\n`;
  output += `    → 滑动窗口大小: ${windowSize} 字节 (${windowSize / 1024}KB)\n\n`;

  output += `FLG: 0x${flg.toString(16).padStart(2, '0').toUpperCase()} (${flg.toString(2).padStart(8, '0')})\n`;
  output += `  FCHECK: ${fcheck} (校验值)\n`;
  output += `  FDICT: ${fdict}${fdict ? ' (使用预设字典)' : ' (无预设字典)'}\n`;
  output += `  FLEVEL: ${flevel}`;
  switch (flevel) {
    case 0: output += ' (最快)'; break;
    case 1: output += ' (快速)'; break;
    case 2: output += ' (默认)'; break;
    case 3: output += ' (最大压缩)'; break;
  }
  output += '\n\n';

  output += `校验: (CMF×256 + FLG) % 31 = ${check}${check === 0 ? ' ✓ (有效)' : ' ✗ (无效!)'}\n`;

  let pos = 2;
  if (fdict && bytes.length >= 6) {
    const dictId = ((bytes[2] << 24) | (bytes[3] << 16) | (bytes[4] << 8) | bytes[5]) >>> 0;
    output += `预设字典 ID: 0x${dictId.toString(16).padStart(8, '0').toUpperCase()}\n`;
    pos = 6;
  }

  output += `压缩数据起始偏移: ${pos} 字节\n`;
  output += `压缩数据长度: ${bytes.length - pos} 字节\n`;

  return output;
}

function parseBrotliHeader(bytes: Uint8Array): string {
  if (bytes.length < 1) {
    throw new Error('数据太短，brotli 头至少需要 1 字节');
  }

  let output = '=== Brotli 头部解析 ===\n\n';

  let wbits: number;
  let pos = 0;
  let bitOffset = 0;

  const readBits = (n: number): number => {
    let val = 0;
    for (let i = 0; i < n; i++) {
      const byteIdx = pos + Math.floor(bitOffset / 8);
      const bitIdx = bitOffset % 8;
      if (byteIdx >= bytes.length) return val;
      val |= ((bytes[byteIdx] >> bitIdx) & 1) << i;
      bitOffset++;
    }
    return val;
  };

  const wbitsMsb = readBits(1);
  if (wbitsMsb === 0) {
    wbits = 16;
  } else {
    const wbitsRest = readBits(3);
    if (wbitsRest === 0) {
      wbits = 17;
    } else {
      wbits = 17 + wbitsRest;
    }
  }
  pos = Math.ceil(bitOffset / 8);

  const windowSize = Math.pow(2, wbits);

  output += `首字节: 0x${bytes[0].toString(16).padStart(2, '0').toUpperCase()} (${bytes[0].toString(2).padStart(8, '0')})\n\n`;
  output += `WBITS (窗口大小位): ${wbits}\n`;
  output += `滑动窗口大小: ${windowSize} 字节 (${(windowSize / 1024 / 1024).toFixed(1)}MB)\n\n`;

  output += `数据起始偏移: ~${pos} 字节\n`;
  output += `剩余数据长度: ${bytes.length - pos} 字节\n`;
  output += `\n注意: brotli 格式没有明确的头部边界，元数据与压缩数据交织在一起。\n`;

  return output;
}

function lz77BackrefDecode(hexInput: string): string {
  const cleaned = hexInput.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  let output = '=== LZ77 回引解码 ===\n\n';
  output += `输入十六进制: ${cleaned.substring(0, 64)}${cleaned.length > 64 ? '...' : ''}\n`;
  output += `总长度: ${cleaned.length / 2} 字节\n\n`;

  let pos = 0;
  const bytes: number[] = [];
  let step = 0;

  output += '--- 解码步骤 ---\n';

  while (pos < cleaned.length) {
    step++;
    if (step > 100) {
      output += `...(超过 100 步，已截断)\n`;
      break;
    }

    if (pos + 2 > cleaned.length) {
      output += `[步骤 ${step}] 剩余数据不足，停止\n`;
      break;
    }

    const flag = parseInt(cleaned.substring(pos, pos + 2), 16);
    pos += 2;

    if (flag === 0) {
      if (pos + 2 > cleaned.length) break;
      const literal = parseInt(cleaned.substring(pos, pos + 2), 16);
      pos += 2;
      bytes.push(literal);
      output += `[步骤 ${step}] 字面量: 0x${literal.toString(16).padStart(2, '0').toUpperCase()} ('${literal >= 32 && literal < 127 ? String.fromCharCode(literal) : '.'}')\n`;
    } else if (flag === 1) {
      if (pos + 4 > cleaned.length) break;
      const offsetHi = parseInt(cleaned.substring(pos, pos + 2), 16);
      const offsetLo = parseInt(cleaned.substring(pos + 2, pos + 4), 16);
      pos += 4;
      const offset = (offsetHi << 8) | offsetLo;
      if (pos + 2 > cleaned.length) break;
      const length = parseInt(cleaned.substring(pos, pos + 2), 16);
      pos += 2;
      output += `[步骤 ${step}] 回引: offset=${offset}, length=${length}\n`;
      for (let j = 0; j < length; j++) {
        if (bytes.length - offset + j >= 0 && bytes.length - offset + j < bytes.length) {
          bytes.push(bytes[bytes.length - offset + j]);
        }
      }
    } else {
      output += `[步骤 ${step}] 未知标记: 0x${flag.toString(16).padStart(2, '0').toUpperCase()}, 停止\n`;
      break;
    }
  }

  output += `\n--- 解码结果 ---\n`;
  output += `解码字节数: ${bytes.length}\n`;
  output += `十六进制: ${bytes.map((b: number) => b.toString(16).padStart(2, '0')).join(' ').substring(0, 256)}${bytes.length > 128 ? '...' : ''}\n`;
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    output += `文本: ${text.substring(0, 256)}${text.length > 256 ? '...' : ''}\n`;
  } catch {
    // ignore
  }

  return output;
}

function deflateInfo(bytes: Uint8Array): string {
  let output = '=== DEFLATE 原始流分析 ===\n\n';
  output += `输入长度: ${bytes.length} 字节\n\n`;

  if (bytes.length < 1) {
    output += '数据为空\n';
    return output;
  }

  const blockTypes = ['存储 (无压缩)', '固定 Huffman', '动态 Huffman', '保留 (错误)'];
  let bitPos = 0;
  let blockNum = 0;

  output += '--- DEFLATE 块结构 ---\n';

  while (bitPos < bytes.length * 8 && blockNum < 20) {
    const byteIdx = Math.floor(bitPos / 8);
    const bitIdx = bitPos % 8;
    if (byteIdx >= bytes.length) break;

    const bfinal = (bytes[byteIdx] >> bitIdx) & 1;
    const btypeByteIdx = Math.floor((bitPos + 1) / 8);
    const btypeBitIdx = (bitPos + 1) % 8;
    if (btypeByteIdx >= bytes.length) break;

    let btype: number;
    if (btypeBitIdx <= 6) {
      btype = (bytes[btypeByteIdx] >> btypeBitIdx) & 3;
    } else {
      btype = ((bytes[btypeByteIdx] >> 7) & 1) | ((bytes[btypeByteIdx + 1] & 1) << 1);
    }

    blockNum++;
    output += `块 ${blockNum}: BFINAL=${bfinal}${bfinal ? ' (最后一个块)' : ''}, BTYPE=${btype} (${blockTypes[btype] ?? '未知'})\n`;

    if (bfinal) break;
    if (btype === 0) {
      const skipBits = 5 + 32 + 16;
      bitPos += skipBits;
      const lenByteIdx = Math.floor(bitPos / 8);
      if (lenByteIdx + 3 < bytes.length) {
        const len = bytes[lenByteIdx] | (bytes[lenByteIdx + 1] << 8);
        bitPos += len * 8;
        output += `  → 存储块长度: ${len} 字节\n`;
      } else {
        break;
      }
    } else {
      bitPos += 3;
      break;
    }
  }

  output += `\n--- 原始数据 (Hex) ---\n`;
  const hexPreview = Array.from(bytes.subarray(0, Math.min(64, bytes.length)))
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join(' ');
  output += `${hexPreview}${bytes.length > 64 ? '...' : ''}\n`;

  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (/^[\x20-\x7e\s]+$/.test(text.substring(0, 100))) {
      output += `\n--- ASCII 预览 ---\n${text.substring(0, 256)}${text.length > 256 ? '...' : ''}\n`;
    }
  } catch {
    // ignore
  }

  output += `\n提示: 如需完整解压，可使用浏览器控制台:\n`;
  output += `  new Response(new Uint8Array([${bytes.subarray(0, 16).join(', ')}...]).buffer)`
  output += `\n    .body!.pipeThrough(new DecompressionStream('deflate'))`
  output += `\n    .pipeTo(new WritableStream())`;

  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="压缩工具集"
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'gzip-info',
        options: [
          { value: 'gzip-info', label: 'Gzip 头部解析' },
          { value: 'zlib-info', label: 'Zlib 头部解析' },
          { value: 'brotli-info', label: 'Brotli 头部解析' },
          { value: 'deflate-raw', label: 'DEFLATE 原始解压' },
          { value: 'lz77-backref', label: 'LZ77 回引解码' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const op = (params.mode as string) || 'gzip-info';
      const bytes = parseHex(input);

      if (op === 'gzip-info') return parseGzipHeader(bytes);
      if (op === 'zlib-info') return parseZlibHeader(bytes);
      if (op === 'brotli-info') return parseBrotliHeader(bytes);
      if (op === 'lz77-backref') return lz77BackrefDecode(input);
      if (op === 'deflate-raw') return deflateInfo(bytes);
    }}
  />
);

export default ToolComponent;
