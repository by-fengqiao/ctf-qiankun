import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

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

const encrypt = (input: string, key: string): string => {
  const order = getKeyOrder(key);
  const cols = order.length;
  const text = input.replace(/\s/g, '');
  const rows = Math.ceil(text.length / cols);
  // Fill grid
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push(idx < text.length ? text[idx] : 'X');
    }
    grid.push(row);
  }
  // Read columns in key order
  const result: string[] = [];
  for (let rank = 0; rank < cols; rank++) {
    const col = order.indexOf(rank);
    for (let r = 0; r < rows; r++) {
      result.push(grid[r][col] ?? '');
    }
  }
  return result.join('');
};

const decrypt = (input: string, key: string): string => {
  const order = getKeyOrder(key);
  const cols = order.length;
  const text = input.replace(/\s/g, '');
  const rows = Math.ceil(text.length / cols);
  // Determine column lengths
  const colLens: number[] = new Array(cols);
  const baseLen = Math.floor(text.length / cols);
  const extra = text.length % cols;
  for (let c = 0; c < cols; c++) {
    colLens[c] = baseLen + (c < extra ? 1 : 0);
  }
  // Assign input text to columns in key order
  const colData: string[] = new Array(cols);
  let idx = 0;
  for (let rank = 0; rank < cols; rank++) {
    const col = order.indexOf(rank);
    colData[col] = text.slice(idx, idx + colLens[col]);
    idx += colLens[col];
  }
  // Read row by row
  const result: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < colLens[c]) {
        result.push(colData[c][r] ?? '');
      }
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'ZEBRA';
      return mode === 'decrypt' ? decrypt(input, key) : encrypt(input, key);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥', type: 'text', placeholder: 'ZEBRA', default: 'ZEBRA' },
    ]}
  />
);

export default ToolComponent;
