import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const HEADER = 'ADFGVX';

const buildGrid = (key: string): string[] => {
  const seen = new Set<string>();
  const grid: string[] = [];
  const add = (ch: string) => {
    if (!seen.has(ch)) {
      seen.add(ch);
      grid.push(ch);
    }
  };
  // ADFGVX uses 36 chars: A-Z + 0-9
  for (const ch of key.toUpperCase().replace(/[^A-Z0-9]/g, '')) add(ch);
  for (let i = 0; i < 26; i++) add(String.fromCharCode(65 + i));
  for (let i = 0; i < 10; i++) add(String(i));
  return grid.slice(0, 36);
};

const findCoord = (grid: string[], ch: string): string => {
  const idx = grid.indexOf(ch);
  if (idx === -1) return '';
  return HEADER[Math.floor(idx / 6)] + HEADER[idx % 6];
};

const getKeyOrder = (key: string): number[] => {
  const chars = key.toUpperCase().split('');
  const indexed = chars.map((c: string, i: number) => ({ c, i }));
  indexed.sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : a.i - b.i));
  const order = new Array(chars.length);
  indexed.forEach((item, rank: number) => {
    order[item.i] = rank;
  });
  return order;
};

const encrypt = (input: string, key: string, gridKey: string): string => {
  const grid = buildGrid(gridKey);
  const text = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Step 1: Polybius substitution
  let substituted = '';
  for (const ch of text) {
    substituted += findCoord(grid, ch);
  }
  if (substituted.length === 0) return '';
  // Step 2: Columnar transposition with key
  const order = getKeyOrder(key);
  const cols = order.length;
  const rows = Math.ceil(substituted.length / cols);
  const grid2: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push(idx < substituted.length ? substituted[idx] : '');
    }
    grid2.push(row);
  }
  // Read columns in key order
  const result: string[] = [];
  for (let rank = 0; rank < cols; rank++) {
    const col = order.indexOf(rank);
    for (let r = 0; r < rows; r++) {
      if (grid2[r][col]) result.push(grid2[r][col]);
    }
    result.push(' ');
  }
  return result.join('').trim();
};

const decrypt = (input: string, key: string, gridKey: string): string => {
  const grid = buildGrid(gridKey);
  const order = getKeyOrder(key);
  const cols = order.length;
  const text = input.replace(/\s/g, '');
  // Determine column lengths
  const totalLen = text.length;
  const baseLen = Math.floor(totalLen / cols);
  const extra = totalLen % cols;
  const colLens: number[] = new Array(cols);
  for (let c = 0; c < cols; c++) {
    colLens[c] = baseLen + (c < extra ? 1 : 0);
  }
  // Split input by column lengths in key order
  const colData: string[] = new Array(cols);
  let idx = 0;
  const parts = input.trim().split(/\s+/);
  if (parts.length === cols) {
    for (let rank = 0; rank < cols; rank++) {
      const col = order.indexOf(rank);
      colData[col] = parts[rank] ?? '';
    }
  } else {
    for (let rank = 0; rank < cols; rank++) {
      const col = order.indexOf(rank);
      colData[col] = text.slice(idx, idx + colLens[col]);
      idx += colLens[col];
    }
  }
  // Read row by row
  const maxRows = Math.max(...colLens);
  const substituted: string[] = [];
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < colLens[c]) {
        substituted.push(colData[c][r] ?? '');
      }
    }
  }
  const subStr = substituted.join('');
  // Reverse Polybius
  const result: string[] = [];
  for (let i = 0; i < subStr.length; i += 2) {
    const r = HEADER.indexOf(subStr[i]);
    const c = HEADER.indexOf(subStr[i + 1]);
    if (r >= 0 && c >= 0) {
      result.push(grid[r * 6 + c] ?? '?');
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'PRIVACY';
      const gridKey = (params.gridkey as string) || 'KEYWORD';
      return mode === 'decrypt' ? decrypt(input, key, gridKey) : encrypt(input, key, gridKey);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '置换密钥', type: 'text', placeholder: 'PRIVACY', default: 'PRIVACY' },
      { name: 'gridkey', label: '方阵密钥', type: 'text', placeholder: 'KEYWORD', default: 'KEYWORD' },
    ]}
  />
);

export default ToolComponent;
