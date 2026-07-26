import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Helpers ---------- */

function findBytes(bytes: Uint8Array, pattern: number[], start: number): number {
  for (let i = start; i <= bytes.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

function findStr(bytes: Uint8Array, str: string, start: number): number {
  const pattern: number[] = [];
  for (let i = 0; i < str.length; i++) {
    pattern.push(str.charCodeAt(i));
  }
  return findBytes(bytes, pattern, start);
}

function extractSubstring(bytes: Uint8Array, start: number, openChar: string, closeChar: string): string {
  // Extract content between delimiters (handles nested parentheses)
  if (bytes[start] !== openChar.charCodeAt(0)) return '';
  let depth = 1;
  let pos = start + 1;
  const chars: string[] = [];
  while (pos < bytes.length && depth > 0) {
    const c = String.fromCharCode(bytes[pos]);
    if (c === '\\' && pos + 1 < bytes.length) {
      const next = String.fromCharCode(bytes[pos + 1]);
      if (next === 'n') chars.push('\n');
      else if (next === 'r') chars.push('\r');
      else if (next === 't') chars.push('\t');
      else if (next === '(') chars.push('(');
      else if (next === ')') chars.push(')');
      else if (next === '\\') chars.push('\\');
      else chars.push(next);
      pos += 2;
      continue;
    }
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) break;
    }
    chars.push(c);
    pos++;
  }
  return chars.join('');
}

function extractHexString(bytes: Uint8Array, start: number): string {
  // Extract content between < and >
  if (bytes[start] !== 0x3c) return '';
  let pos = start + 1;
  const chars: string[] = [];
  while (pos < bytes.length && bytes[pos] !== 0x3e) {
    chars.push(String.fromCharCode(bytes[pos]));
    pos++;
  }
  return chars.join('');
}

interface PdfObject {
  num: number;
  gen: number;
  type: string;
  offset: number;
  dict: Record<string, string>;
}

function parseObjects(bytes: Uint8Array): PdfObject[] {
  const objects: PdfObject[] = [];
  const objRegex = /(\d+)\s+(\d+)\s+obj/g;
  const text = bytesToText(bytes);
  let match: RegExpExecArray | null;
  while ((match = objRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const gen = parseInt(match[2], 10);
    const offset = match.index;
    // Find the object type and dictionary
    const objContent = text.substring(offset, Math.min(offset + 2000, text.length));
    // Determine type
    let type = 'Unknown';
    const typeMatch = /\/Type\s*\/(\w+)/.exec(objContent);
    if (typeMatch) type = typeMatch[1];
    else {
      const subtypeMatch = /\/Subtype\s*\/(\w+)/.exec(objContent);
      if (subtypeMatch) type = subtypeMatch[1];
    }
    // Parse dictionary entries
    const dict: Record<string, string> = {};
    const dictRegex = /\/(\w+)\s*([(/[^\s>]+)/g;
    // Simplified dict parsing
    const lines = objContent.split('\n');
    for (const line of lines) {
      const kvMatch = /\/(\w+)\s*\(([^)]*)\)/.exec(line);
      if (kvMatch) {
        dict[kvMatch[1]] = kvMatch[2];
      }
    }
    objects.push({ num, gen, type, offset, dict });
  }
  return objects;
}

function extractMetadata(bytes: Uint8Array): Record<string, string> {
  const metadata: Record<string, string> = {};
  const text = bytesToText(bytes);
  const patterns: Record<string, RegExp> = {
    Title: /\/Title\s*\(([^)]*)\)/,
    Author: /\/Author\s*\(([^)]*)\)/,
    Subject: /\/Subject\s*\(([^)]*)\)/,
    Keywords: /\/Keywords\s*\(([^)]*)\)/,
    Creator: /\/Creator\s*\(([^)]*)\)/,
    Producer: /\/Producer\s*\(([^)]*)\)/,
    CreationDate: /\/CreationDate\s*\(([^)]*)\)/,
    ModDate: /\/ModDate\s*\(([^)]*)\)/,
  };
  for (const [key, regex] of Object.entries(patterns)) {
    const m = regex.exec(text);
    if (m) metadata[key] = m[1];
  }
  return metadata;
}

function extractJavaScript(bytes: Uint8Array): string[] {
  const scripts: string[] = [];
  const text = bytesToText(bytes);
  // Find /JS ( ... ) or /JS < ... >
  const jsRegex = /\/JS\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = jsRegex.exec(text)) !== null) {
    if (match[1].length > 0) {
      scripts.push(match[1].substring(0, 500));
    }
  }
  // Also find /JavaScript action type
  const jsActionRegex = /\/S\s*\/JavaScript/g;
  let jsActionCount = 0;
  while (jsActionRegex.exec(text) !== null) {
    jsActionCount++;
  }
  if (scripts.length === 0 && jsActionCount > 0) {
    scripts.push(`(发现 ${jsActionCount} 个 JavaScript 动作)`);
  }
  return scripts;
}

function extractEmbeddedFiles(bytes: Uint8Array): string[] {
  const files: string[] = [];
  const text = bytesToText(bytes);
  // Find /EmbeddedFiles
  const efRegex = /\/Filespec\s/g;
  let count = 0;
  while (efRegex.exec(text) !== null) count++;
  // Find filenames
  const nameRegex = /\/F\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = nameRegex.exec(text)) !== null && files.length < 20) {
    if (match[1] && !match[1].startsWith('http')) {
      files.push(match[1]);
    }
  }
  if (files.length === 0 && count > 0) {
    files.push(`(发现 ${count} 个内嵌文件规格)`);
  }
  return files;
}

function extractAcroFormFields(bytes: Uint8Array): string[] {
  const fields: string[] = [];
  const text = bytesToText(bytes);
  // Find /AcroForm
  const hasAcroForm = /\/AcroForm\s/.test(text);
  if (!hasAcroForm) return fields;
  // Find field names /T ( ... )
  const tRegex = /\/T\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = tRegex.exec(text)) !== null && fields.length < 50) {
    if (match[1]) fields.push(match[1]);
  }
  return fields;
}

function extractLinks(bytes: Uint8Array): string[] {
  const links: string[] = [];
  const text = bytesToText(bytes);
  // Find /URI ( ... )
  const uriRegex = /\/URI\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = uriRegex.exec(text)) !== null && links.length < 50) {
    if (match[1]) links.push(match[1]);
  }
  return links;
}

function checkEncryption(bytes: Uint8Array): { encrypted: boolean; details: string } {
  const text = bytesToText(bytes);
  const encMatch = /\/Encrypt\s+(\d+)\s+(\d+)\s+R/.exec(text);
  if (encMatch) {
    return {
      encrypted: true,
      details: `加密对象 ${encMatch[1]} ${encMatch[2]} R`,
    };
  }
  // Check for /Standard filter
  const stdMatch = /\/Filter\s*\/Standard/.exec(text);
  if (stdMatch) {
    return { encrypted: true, details: '标准加密过滤器' };
  }
  return { encrypted: false, details: '无加密' };
}

function findStreams(bytes: Uint8Array): { count: number; compressed: number } {
  const text = bytesToText(bytes);
  const streamCount = (text.match(/stream\r?\n/g) || []).length;
  const flateCount = (text.match(/\/FlateDecode/g) || []).length;
  return { count: streamCount, compressed: flateCount };
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 8) throw new Error('数据过短，无法解析 PDF');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  PDF 文件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  // Check header
  const header = bytesToText(bytes.subarray(0, Math.min(20, bytes.length)));
  const pdfMatch = /^%PDF-(\d+\.\d+)/.exec(header);
  if (!pdfMatch) {
    L.push(`⚠️ 警告: 未找到有效 PDF 头部 (期望 "%PDF-X.Y")`);
    L.push(`  前20字节: ${header.replace(/[^\x20-\x7e]/g, '.')}`);
    L.push('');
  } else {
    L.push(`版本: PDF ${pdfMatch[1]}`);
    L.push('');
  }

  L.push(`文件大小: ${bytes.length} 字节`);
  L.push('');

  // Find xref
  const xrefOffset = findStr(bytes, 'xref', 0);
  const startXrefOffset = findStr(bytes, 'startxref', 0);
  L.push('── 交叉引用表 ──');
  if (xrefOffset >= 0) {
    L.push(`  xref 位置: 0x${xrefOffset.toString(16).toUpperCase()} (${xrefOffset})`);
  } else {
    L.push('  xref: 未找到传统 xref 表（可能是 xref 流）');
  }
  if (startXrefOffset >= 0) {
    const numStart = startXrefOffset + 9;
    const numText = bytesToText(bytes.subarray(numStart, Math.min(numStart + 20, bytes.length)));
    const numMatch = /(\d+)/.exec(numText);
    if (numMatch) {
      L.push(`  startxref 指向: ${numMatch[1]}`);
    }
  }
  L.push('');

  // Parse objects
  const objects = parseObjects(bytes);
  L.push('── 对象列表 ──');
  L.push(`  对象总数: ${objects.length}`);
  const typeCounts: Record<string, number> = {};
  objects.forEach((o: PdfObject) => {
    typeCounts[o.type] = (typeCounts[o.type] ?? 0) + 1;
  });
  L.push(`  对象类型统计:`);
  Object.entries(typeCounts).forEach(([type, count]: [string, number]) => {
    L.push(`    ${type}: ${count}`);
  });
  L.push('');

  // Extract metadata
  const metadata = extractMetadata(bytes);
  L.push('── 元数据 (Info 字典) ──');
  if (Object.keys(metadata).length === 0) {
    L.push('  (未找到元数据)');
  } else {
    Object.entries(metadata).forEach(([key, value]: [string, string]) => {
      L.push(`  ${key}: ${value}`);
    });
  }
  L.push('');

  // Check encryption
  const encryption = checkEncryption(bytes);
  L.push('── 加密检测 ──');
  L.push(`  加密: ${encryption.encrypted ? '⚠️ 是' : '否'}`);
  L.push(`  详情: ${encryption.details}`);
  L.push('');

  // Streams
  const streams = findStreams(bytes);
  L.push('── 流对象 ──');
  L.push(`  流总数: ${streams.count}`);
  L.push(`  FlateDecode 压缩流: ${streams.compressed}`);
  L.push('');

  // JavaScript
  const jsScripts = extractJavaScript(bytes);
  L.push('── JavaScript 动作 ──');
  if (jsScripts.length === 0) {
    L.push('  (未发现 JavaScript)');
  } else {
    jsScripts.forEach((js: string, i: number) => {
      L.push(`[${i + 1}] ${js}`);
    });
  }
  L.push('');

  // Embedded files
  const embedded = extractEmbeddedFiles(bytes);
  L.push('── 内嵌文件 ──');
  if (embedded.length === 0) {
    L.push('  (未发现内嵌文件)');
  } else {
    embedded.forEach((f: string, i: number) => {
      L.push(`[${i + 1}] ${f}`);
    });
  }
  L.push('');

  // AcroForm fields
  const fields = extractAcroFormFields(bytes);
  L.push('── 表单字段 (AcroForm) ──');
  if (fields.length === 0) {
    L.push('  (未发现表单字段)');
  } else {
    L.push(`  字段数: ${fields.length}`);
    fields.forEach((f: string, i: number) => {
      L.push(`  [${i + 1}] ${f}`);
    });
  }
  L.push('');

  // Links
  const links = extractLinks(bytes);
  L.push('── 链接 (URI) ──');
  if (links.length === 0) {
    L.push('  (未发现链接)');
  } else {
    L.push(`  链接数: ${links.length}`);
    links.forEach((u: string, i: number) => {
      L.push(`  [${i + 1}] ${u}`);
    });
  }
  L.push('');

  L.push('── 备注 ──');
  L.push('  本工具通过文本扫描提取 PDF 结构信息');
  L.push('  流对象内容需要 Flate 解压才能查看');
  L.push('  加密 PDF 需要密码才能解析受保护内容');
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="PDF文件解析"
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
