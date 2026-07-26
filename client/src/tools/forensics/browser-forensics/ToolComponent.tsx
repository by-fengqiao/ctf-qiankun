import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText, readU16BE, readU32BE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- SQLite varint ---------- */

function readVarint(b: Uint8Array, off: number): [number, number] {
  let result = 0;
  for (let i = 0; i < 8; i++) {
    if (off + i >= b.length) return [result, off + i];
    const byte = b[off + i];
    result = result * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return [result, off + i + 1];
  }
  if (off + 8 < b.length) {
    result = result * 256 + b[off + 8];
  }
  return [result, off + 9];
}

/* ---------- Serial type ---------- */

function serialTypeSize(type: number): number {
  if (type < 0) return 0;
  if (type <= 4) return type;
  if (type === 5) return 6;
  if (type === 6 || type === 7) return 8;
  if (type === 8 || type === 9) return 0;
  if (type >= 12) return type % 2 === 0 ? (type - 12) / 2 : (type - 13) / 2;
  return 0;
}

interface Field {
  type: number;
  value: string;
  size: number;
}

function readField(b: Uint8Array, off: number, type: number): Field {
  if (type === 0) return { type, value: 'NULL', size: 0 };
  if (type === 8) return { type, value: '0', size: 0 };
  if (type === 9) return { type, value: '1', size: 0 };
  if (type === 1) return { type, value: String((b[off] << 24) >> 24), size: 1 };
  if (type === 2) return { type, value: String((b[off] << 24 | b[off + 1] << 16) >> 16), size: 2 };
  if (type === 3) {
    let v = (b[off] << 16) | (b[off + 1] << 8) | b[off + 2];
    if (b[off] & 0x80) v -= 0x800000;
    return { type, value: String(v), size: 3 };
  }
  if (type === 4) return { type, value: String(readU32BE(b, off)), size: 4 };
  if (type === 5) {
    let v = 0;
    for (let i = 0; i < 6; i++) v = v * 256 + b[off + i];
    return { type, value: String(v), size: 6 };
  }
  if (type === 6) {
    let v = 0;
    for (let i = 0; i < 8; i++) v = v * 256 + b[off + i];
    return { type, value: String(v), size: 8 };
  }
  if (type === 7) {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    for (let i = 0; i < 8; i++) view.setUint8(i, b[off + i]);
    return { type, value: String(view.getFloat64(0)), size: 8 };
  }
  if (type >= 13 && type % 2 === 1) {
    const len = (type - 13) / 2;
    return { type, value: bytesToText(b.subarray(off, off + len)), size: len };
  }
  if (type >= 12 && type % 2 === 0) {
    const len = (type - 12) / 2;
    return { type, value: `[BLOB ${len}B]`, size: len };
  }
  return { type, value: '?', size: 0 };
}

/* ---------- B-tree page parser ---------- */

interface Cell {
  rowid: number;
  fields: string[];
}

function parseLeafTablePage(b: Uint8Array, pageOff: number, pageSize: number, isPage1: boolean): Cell[] {
  const hdrOff = isPage1 ? pageOff + 100 : pageOff;
  if (hdrOff + 8 > b.length) return [];
  const pageType = b[hdrOff];
  if (pageType !== 0x0d) return [];

  const cellCount = readU16BE(b, hdrOff + 3);
  const cellPtrStart = hdrOff + 8;
  const cells: Cell[] = [];

  for (let i = 0; i < cellCount; i++) {
    const ptrOff = cellPtrStart + i * 2;
    if (ptrOff + 2 > b.length) break;
    const cellOff = pageOff + readU16BE(b, ptrOff);
    if (cellOff >= b.length) continue;

    const [payloadLen, off1] = readVarint(b, cellOff);
    const [rowid, off2] = readVarint(b, off1);
    const payloadStart = off2;

    /* Parse record header */
    const [hdrLen, hdrDataStart] = readVarint(b, payloadStart);
    const serialTypes: number[] = [];
    let pos = hdrDataStart;
    const hdrEnd = payloadStart + hdrLen;
    while (pos < hdrEnd) {
      const [st, next] = readVarint(b, pos);
      serialTypes.push(st);
      pos = next;
    }

    /* Parse field values */
    const fields: string[] = [];
    let dataPos = hdrEnd;
    for (const st of serialTypes) {
      const f = readField(b, dataPos, st);
      fields.push(f.value);
      dataPos += f.size;
    }
    cells.push({ rowid, fields });
  }
  return cells;
}

function collectAllLeafPages(b: Uint8Array, pageSize: number): number[] {
  const pages: number[] = [];
  const numPages = Math.floor(b.length / pageSize);
  for (let p = 0; p < numPages; p++) {
    const off = p * pageSize;
    const hdrOff = p === 0 ? off + 100 : off;
    if (hdrOff >= b.length) continue;
    if (b[hdrOff] === 0x0d) pages.push(off);
  }
  return pages;
}

/* ---------- Chrome time conversion ---------- */

function chromeTimeToISO(us: number): string {
  if (us === 0) return '(无)';
  const epoch = 11644473600000000;
  const ms = (us / 1000) - epoch / 1000;
  if (ms < 0 || ms > 20000000000000) return '(无效)';
  return new Date(ms).toISOString();
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  浏览器数据解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  if (bytes.length < 100) throw new Error('数据过短，无法解析 SQLite 头');
  const magic = bytesToText(bytes.subarray(0, 16));
  if (!magic.startsWith('SQLite format 3')) {
    const headHex = Array.from(bytes.slice(0, 16))
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    L.push(`⚠️ 未检测到 SQLite 魔数`);
    L.push(`  前 16 字节: ${headHex}`);
    L.push(`  期望: "SQLite format 3\\0"`);
    return L.join('\n');
  }

  const pageSize = readU16BE(bytes, 16) === 1 ? 65536 : readU16BE(bytes, 16);
  const numPages = readU32BE(bytes, 28);

  L.push('── SQLite 文件头 ──');
  L.push(`  魔数: "SQLite format 3" ✓`);
  L.push(`  页面大小: ${pageSize} 字节`);
  L.push(`  页面数量: ${numPages}`);
  L.push(`  文件大小: ${bytes.length} 字节 (${Math.floor(bytes.length / pageSize)} 页)`);
  L.push('');

  /* --- Collect all leaf table pages --- */
  const leafPages = collectAllLeafPages(bytes, pageSize);
  L.push(`  叶子表页数: ${leafPages.length}`);
  L.push('');

  /* --- Parse page 1 for schema (sqlite_master) --- */
  const schemaCells = parseLeafTablePage(bytes, 0, pageSize, true);
  L.push('── 表结构 (sqlite_master) ──');
  if (schemaCells.length === 0) {
    L.push('  无表定义');
  } else {
    for (const c of schemaCells) {
      const type = c.fields[0] ?? '';
      const name = c.fields[1] ?? '';
      const sql = c.fields[4] ?? '';
      if (type === 'table' && name && !name.startsWith('sqlite_')) {
        L.push(`  表: ${name}`);
        const sqlShort = sql.length > 200 ? sql.substring(0, 200) + '...' : sql;
        L.push(`    ${sqlShort}`);
      }
    }
  }
  L.push('');

  /* --- Collect all records --- */
  const allRecords: Cell[] = [];
  for (const pageOff of leafPages) {
    const cells = parseLeafTablePage(bytes, pageOff, pageSize, pageOff === 0);
    for (const c of cells) allRecords.push(c);
  }

  /* --- Try to identify history/cookies by field content --- */
  const urls: { url: string; title: string; visitCount: string }[] = [];
  const cookies: { host: string; name: string; value: string; path: string; expires: string }[] = [];
  const otherUrls: string[] = [];

  for (const rec of allRecords) {
    const fields = rec.fields;

    /* Check if this looks like a urls/history record (has URL in a field) */
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.startsWith('http://') || f.startsWith('https://')) {
        /* Check if another field looks like a title or visit count */
        let title = '';
        let visitCount = '';
        for (let j = 0; j < fields.length; j++) {
          if (j === i) continue;
          const v = fields[j];
          if (/^\d+$/.test(v) && parseInt(v, 10) >= 0 && parseInt(v, 10) < 1000000) {
            visitCount = v;
          } else if (v.length > 2 && v.length < 500 && !v.startsWith('http') && !v.includes('\n')) {
            if (!title && v !== '0' && v !== '1') title = v;
          }
        }
        urls.push({ url: f, title, visitCount });
        break;
      }
    }

    /* Check if this looks like a cookies record (has host_key pattern) */
    let hasHost = false;
    let host = '';
    let cookieName = '';
    let cookieValue = '';
    let cookiePath = '';
    let cookieExpires = '';
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.startsWith('.') && f.length < 100 && f.includes('.')) {
        hasHost = true;
        host = f;
      } else if (/^[a-z0-9._-]+\.[a-z]{2,}$/i.test(f) && f.length < 100) {
        if (!host) { hasHost = true; host = f; }
      }
      if (f === '/' && i > 0) cookiePath = '/';
    }
    if (hasHost) {
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (/^\d{15,}$/.test(f)) {
          cookieExpires = chromeTimeToISO(Number(f));
        }
      }
      /* Find name/value after host */
      const hostIdx = fields.indexOf(host);
      if (hostIdx >= 0 && hostIdx + 2 < fields.length) {
        cookieName = fields[hostIdx + 1] ?? '';
        cookieValue = fields[hostIdx + 2] ?? '';
      }
      if (cookieName && cookieName !== '/' && !/^\d+$/.test(cookieName)) {
        cookies.push({ host, name: cookieName, value: cookieValue.substring(0, 100), path: cookiePath, expires: cookieExpires });
      }
    }
  }

  /* --- Also scan raw data for URLs --- */
  if (urls.length === 0) {
    const rawText = bytesToText(bytes);
    const urlRegex = /https?:\/\/[^\s"'<>\x00-\x1f]+/gi;
    let m: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((m = urlRegex.exec(rawText)) !== null) {
      const url = m[0].substring(0, 300);
      if (!seen.has(url) && url.length > 10) {
        seen.add(url);
        otherUrls.push(url);
      }
      if (otherUrls.length >= 50) break;
    }
  }

  /* --- Output URLs / History --- */
  L.push('── 访问历史 ──');
  if (urls.length > 0) {
    const max = Math.min(30, urls.length);
    L.push(`  共 ${urls.length} 条 URL，显示前 ${max} 条:`);
    L.push('');
    for (let i = 0; i < max; i++) {
      const u = urls[i];
      L.push(`  [${i + 1}] ${u.url}`);
      if (u.title) L.push(`      标题: ${u.title}`);
      if (u.visitCount) L.push(`      访问次数: ${u.visitCount}`);
    }
  } else if (otherUrls.length > 0) {
    L.push(`  (从原始数据扫描到 ${otherUrls.length} 条 URL):`);
    L.push('');
    for (let i = 0; i < otherUrls.length; i++) {
      L.push(`  [${i + 1}] ${otherUrls[i]}`);
    }
  } else {
    L.push('  未发现访问历史');
  }
  L.push('');

  /* --- Output Cookies --- */
  L.push('── Cookie ──');
  if (cookies.length > 0) {
    const max = Math.min(30, cookies.length);
    L.push(`  共 ${cookies.length} 条 Cookie，显示前 ${max} 条:`);
    L.push('');
    for (let i = 0; i < max; i++) {
      const c = cookies[i];
      L.push(`  [${i + 1}] ${c.host}`);
      L.push(`      名称: ${c.name}`);
      L.push(`      值:   ${c.value}`);
      if (c.path) L.push(`      路径: ${c.path}`);
      if (c.expires) L.push(`      过期: ${c.expires}`);
    }
  } else {
    L.push('  未发现 Cookie');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="浏览器数据解析"
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
