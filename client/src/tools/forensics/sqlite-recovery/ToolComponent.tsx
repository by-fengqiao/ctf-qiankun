import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16BE, readU32BE, bytesToText, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const PAGE_TYPES: Record<number, string> = {
  0x02: 'Interior Index B-tree',
  0x05: 'Interior Table B-tree',
  0x0a: 'Leaf Index B-tree',
  0x0d: 'Leaf Table B-tree',
};

function readSQLiteVarint(bytes: Uint8Array, offset: number): { value: bigint; consumed: number } {
  let result = 0n;
  for (let i = 0; i < 9; i++) {
    if (offset + i >= bytes.length) return { value: result, consumed: i };
    const byte = bytes[offset + i];
    if (i < 8) {
      result = (result << 7n) | BigInt(byte & 0x7f);
      if ((byte & 0x80) === 0) return { value: result, consumed: i + 1 };
    } else {
      result = (result << 8n) | BigInt(byte);
      return { value: result, consumed: 9 };
    }
  }
  return { value: result, consumed: 9 };
}

function parseRecord(bytes: Uint8Array, offset: number, end: number): string[] {
  const values: string[] = [];
  let pos = offset;
  if (pos + 1 > end) return [];

  const { value: headerLen, consumed: hlConsumed } = readSQLiteVarint(bytes, pos);
  pos += hlConsumed;
  const headerEnd = offset + Number(headerLen);
  if (headerEnd > end || headerEnd > bytes.length) return [];

  const serialTypes: number[] = [];
  while (pos < headerEnd) {
    const { value: st, consumed: stConsumed } = readSQLiteVarint(bytes, pos);
    serialTypes.push(Number(st));
    pos += stConsumed;
  }

  pos = headerEnd;
  for (const st of serialTypes) {
    if (st === 0) {
      values.push('NULL');
    } else if (st === 1) {
      if (pos + 1 > end) break;
      const val = (bytes[pos] << 24) >> 24; // signed 8-bit
      values.push(String(val));
      pos += 1;
    } else if (st === 2) {
      if (pos + 2 > end) break;
      let val = (bytes[pos] << 8) | bytes[pos + 1];
      val = val << 16 >> 16; // sign extend
      values.push(String(val));
      pos += 2;
    } else if (st === 3) {
      if (pos + 3 > end) break;
      let val = (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
      val = val << 8 >> 8; // sign extend 24-bit
      values.push(String(val));
      pos += 3;
    } else if (st === 4) {
      if (pos + 4 > end) break;
      let val = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      val = val | 0; // convert to signed
      values.push(String(val));
      pos += 4;
    } else if (st === 5) {
      if (pos + 6 > end) break;
      let val = 0n;
      for (let i = 0; i < 6; i++) val = (val << 8n) | BigInt(bytes[pos + i]);
      if (val & (1n << 47n)) val |= (~0n << 48n); // sign extend
      values.push(val.toString());
      pos += 6;
    } else if (st === 6) {
      if (pos + 8 > end) break;
      let val = 0n;
      for (let i = 0; i < 8; i++) val = (val << 8n) | BigInt(bytes[pos + i]);
      values.push(val.toString());
      pos += 8;
    } else if (st === 7) {
      if (pos + 8 > end) break;
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 8; i++) view.setUint8(i, bytes[pos + i]);
      values.push(String(view.getFloat64(0)));
      pos += 8;
    } else if (st === 8) {
      values.push('0');
    } else if (st === 9) {
      values.push('1');
    } else if (st >= 12 && st % 2 === 0) {
      const len = (st - 12) / 2;
      if (pos + len > end) break;
      values.push(`[BLOB ${len}B]`);
      pos += len;
    } else if (st >= 13 && st % 2 === 1) {
      const len = (st - 13) / 2;
      if (pos + len > end) break;
      const text = bytesToText(bytes.subarray(pos, pos + len));
      values.push(text.substring(0, 100).replace(/\\s+/g, ' '));
      pos += len;
    }
  }

  return values;
}

interface TableSchema {
  type: string;
  name: string;
  tblName: string;
  rootPage: number;
  sql: string;
}

function parsePage(bytes: Uint8Array, pageNum: number, pageSize: number, schemaOnly = false): {
  pageType: number;
  cellCount: number;
  freeBlockOffset: number;
  unallocatedStart: number;
  cellContentStart: number;
  records: string[][];
  deletedRecords: string[][];
} {
  const pageOffset = (pageNum - 1) * pageSize;
  const headerOffset = pageNum === 1 ? pageOffset + 100 : pageOffset;
  if (headerOffset + 8 > bytes.length) {
    return { pageType: 0, cellCount: 0, freeBlockOffset: 0, unallocatedStart: 0, cellContentStart: 0, records: [], deletedRecords: [] };
  }

  const pageType = bytes[headerOffset];
  const freeBlockOffset = readU16BE(bytes, headerOffset + 1);
  const cellCount = readU16BE(bytes, headerOffset + 3);
  const cellContentStart = readU16BE(bytes, headerOffset + 5);
  const unallocatedStart = 8 + cellCount * 2; // after header + cell pointers

  const records: string[][] = [];
  const deletedRecords: string[][] = [];

  // Skip parsing record content if only schema is requested
  if (schemaOnly && pageType !== 0x0d && pageType !== 0x0a) {
    return { pageType, cellCount, freeBlockOffset, unallocatedStart, cellContentStart, records: [], deletedRecords: [] };
  }

  // Read cell pointers
  const cellOffsets: number[] = [];
  for (let i = 0; i < cellCount; i++) {
    const ptrOffset = headerOffset + 8 + i * 2;
    if (ptrOffset + 2 > bytes.length) break;
    const cellOffset = readU16BE(bytes, ptrOffset);
    cellOffsets.push(pageOffset + cellOffset);
  }

  // Parse active records
  for (const cellOffset of cellOffsets) {
    if (cellOffset + 2 > bytes.length) continue;
    const { value: payloadLen, consumed: plConsumed } = readSQLiteVarint(bytes, cellOffset);
    let pos = cellOffset + plConsumed;
    if (pageType === 0x0d) { // leaf table b-tree has rowid
      const { value: rowid, consumed: rConsumed } = readSQLiteVarint(bytes, pos);
      pos += rConsumed;
      const rec = parseRecord(bytes, pos, pos + Number(payloadLen) - rConsumed);
      rec.unshift(rowid.toString());
      records.push(rec);
    } else if (pageType === 0x0a) { // leaf index b-tree
      const rec = parseRecord(bytes, pos, pos + Number(payloadLen));
      records.push(rec);
    }
  }

  // Recover deleted records from freeblocks
  let fb = freeBlockOffset;
  const visited = new Set<number>();
  while (fb > 0 && fb < pageSize && !visited.has(fb)) {
    visited.add(fb);
    const fbOffset = pageOffset + fb;
    if (fbOffset + 4 > bytes.length) break;
    const nextFb = readU16BE(bytes, fbOffset);
    const fbSize = readU16BE(bytes, fbOffset + 2);
    if (fbSize < 10) { // too small to contain a record
      fb = nextFb;
      continue;
    }
    // Try to parse records in freeblock data
    const dataOffset = fbOffset + 4;
    const dataEnd = fbOffset + fbSize;
    let pos = dataOffset;
    while (pos + 1 < dataEnd) {
      const { value: headerLen, consumed: hlConsumed } = readSQLiteVarint(bytes, pos);
      if (headerLen < 2 || headerLen > fbSize) { pos++; continue; }
      const rec = parseRecord(bytes, pos + hlConsumed, dataEnd);
      if (rec.length > 0 && rec.some((v: string) => v.length > 0 && v !== 'NULL')) {
        deletedRecords.push(rec);
      }
      pos++;
    }
    fb = nextFb;
  }

  // Recover from unallocated space
  const unallocatedEnd = cellContentStart;
  if (unallocatedStart < unallocatedEnd) {
    let pos = headerOffset + unallocatedStart;
    const end = headerOffset + unallocatedEnd;
    while (pos + 1 < end) {
      const { value: headerLen, consumed: hlConsumed } = readSQLiteVarint(bytes, pos);
      if (headerLen < 2 || headerLen > 1000) { pos++; continue; }
      const rec = parseRecord(bytes, pos + hlConsumed, end);
      if (rec.length > 0 && rec.some((v: string) => v.length > 0 && v !== 'NULL')) {
        deletedRecords.push(rec);
      }
      pos++;
    }
  }

  return { pageType, cellCount, freeBlockOffset, unallocatedStart, cellContentStart, records, deletedRecords };
}

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 100) {
    throw new Error('数据过短，无法解析 SQLite 文件');
  }

  const magic = bytesToText(bytes.subarray(0, 16));
  if (!magic.startsWith('SQLite format 3')) {
    throw new Error('无效的 SQLite 文件（期望 "SQLite format 3" 头部）');
  }

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  SQLite 数据库恢复报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  let pageSize = readU16BE(bytes, 16);
  pageSize = pageSize === 1 ? 65536 : pageSize;
  const writeVersion = bytes[18];
  const readVersion = bytes[19];
  const reservedSpace = bytes[20];
  const fileChangeCounter = readU32BE(bytes, 24) >>> 0;
  const dbSizePages = readU32BE(bytes, 28) >>> 0;
  const schemaCookie = readU32BE(bytes, 40) >>> 0;
  const schemaFormat = readU32BE(bytes, 44) >>> 0;
  const textEncoding = readU32BE(bytes, 56) >>> 0;
  const encodingNames: Record<number, string> = { 1: 'UTF-8', 2: 'UTF-16LE', 3: 'UTF-16BE' };

  L.push('── 数据库头 ──');
  L.push(`  版本: SQLite 3`);
  L.push(`  页大小: ${pageSize} 字节`);
  L.push(`  写版本: ${writeVersion}`);
  L.push(`  读版本: ${readVersion}`);
  L.push(`  页保留空间: ${reservedSpace} 字节`);
  L.push(`  文件变更计数: ${fileChangeCounter}`);
  L.push(`  数据库页数: ${dbSizePages}`);
  L.push(`  模式版本: ${schemaCookie}`);
  L.push(`  模式格式: ${schemaFormat}`);
  L.push(`  文本编码: ${encodingNames[textEncoding] || 'Unknown'}`);
  L.push('');

  // Parse schema from page 1
  const page1 = parsePage(bytes, 1, pageSize);
  const schema: TableSchema[] = [];
  L.push('── 数据库 Schema (sqlite_master) ──');
  for (const rec of page1.records) {
    if (rec.length >= 5) {
      const [rowid, type, name, tblName, rootPage, sql] = rec;
      schema.push({
        type: type || '',
        name: name || '',
        tblName: tblName || '',
        rootPage: Number(rootPage) || 0,
        sql: sql || '',
      });
    }
  }
  const tables = schema.filter((s: TableSchema) => s.type === 'table');
  const indexes = schema.filter((s: TableSchema) => s.type === 'index');
  const views = schema.filter((s: TableSchema) => s.type === 'view');

  L.push(`  表数量: ${tables.length}`);
  L.push(`  索引数量: ${indexes.length}`);
  L.push(`  视图数量: ${views.length}`);
  L.push('');

  for (const table of tables.slice(0, 20)) {
    L.push(`  ── 表: ${table.name} ──`);
    L.push(`    根页: ${table.rootPage}`);
    L.push(`    SQL: ${table.sql || '(无)'}`);
    L.push('');
  }
  if (tables.length > 20) {
    L.push(`  ...还有 ${tables.length - 20} 个表`);
    L.push('');
  }

  L.push('── 页统计 ──');
  const typeCounts: Record<string, number> = {};
  let totalCells = 0;
  const maxPages = Math.min(dbSizePages, 100);
  for (let p = 1; p <= maxPages; p++) {
    const page = parsePage(bytes, p, pageSize, true);
    if (page.pageType === 0) continue;
    const typeName = PAGE_TYPES[page.pageType] || `Unknown(${page.pageType})`;
    typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    totalCells += page.cellCount;
  }
  L.push(`  已扫描页数: ${maxPages} / ${dbSizePages}`);
  L.push(`  总记录数估计: ~${totalCells}`);
  L.push('  页类型分布:');
  for (const [type, count] of Object.entries(typeCounts)) {
    L.push(`    ${type}: ${count} 页`);
  }
  L.push('');

  // Sample records from first table
  const firstTable = tables[0];
  if (firstTable && firstTable.rootPage > 0 && firstTable.rootPage <= maxPages) {
    const rootPage = parsePage(bytes, firstTable.rootPage, pageSize);
    if (rootPage.records.length > 0) {
      L.push(`── ${firstTable.name} 表样例记录 (前 10 条) ──`);
      for (const rec of rootPage.records.slice(0, 10)) {
        L.push(`  [${rec[0]}] ${rec.slice(1).join(' | ')}`);
      }
      L.push('');
    }
  }

  // Deleted records recovery
  L.push('── 已删除记录恢复 ──');
  const allDeleted: string[][] = [];
  for (let p = 1; p <= maxPages; p++) {
    const page = parsePage(bytes, p, pageSize);
    if (page.deletedRecords.length > 0) {
      allDeleted.push(...page.deletedRecords);
    }
  }
  if (allDeleted.length > 0) {
    L.push(`  找到 ${allDeleted.length} 条已删除记录:`);
    for (const rec of allDeleted.slice(0, 30)) {
      L.push(`    ${rec.join(' | ')}`);
    }
    if (allDeleted.length > 30) {
      L.push(`    ...还有 ${allDeleted.length - 30} 条记录`);
    }
  } else {
    L.push('  未找到可恢复的已删除记录');
  }

  L.push('');
  L.push('💡 提示: 已删除记录恢复依赖未被覆盖的空闲块与未分配空间。');
  return L.join('\\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="SQLite数据库恢复"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 20 * 1024 * 1024);
        const noteIdx = hex.indexOf('\\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
