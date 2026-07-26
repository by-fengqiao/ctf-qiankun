import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const encrypt = (input: string, cols: number): string => {
  const text = input.replace(/\s/g, '');
  const len = text.length;
  if (len === 0 || cols < 1) return text;
  const rows = Math.ceil(len / cols);
  // Fill grid row by row
  const grid: (string | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push(idx < len ? text[idx] : null);
    }
    grid.push(row);
  }
  // Read in spiral (clockwise from top-left)
  const result: string[] = [];
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      if (grid[top][c] !== null) result.push(grid[top][c] as string);
    }
    top++;
    for (let r = top; r <= bottom; r++) {
      if (grid[r][right] !== null) result.push(grid[r][right] as string);
    }
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        if (grid[bottom][c] !== null) result.push(grid[bottom][c] as string);
      }
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        if (grid[r][left] !== null) result.push(grid[r][left] as string);
      }
      left++;
    }
  }
  return result.join('');
};

const decrypt = (input: string, cols: number): string => {
  const text = input.replace(/\s/g, '');
  const len = text.length;
  if (len === 0 || cols < 1) return text;
  const rows = Math.ceil(len / cols);
  // Build empty grid and determine spiral visit order
  const grid: (string | null)[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(null),
  );
  const order: [number, number][] = [];
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      if (top * cols + c < len) order.push([top, c]);
    }
    top++;
    for (let r = top; r <= bottom; r++) {
      if (r * cols + right < len) order.push([r, right]);
    }
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        if (bottom * cols + c < len) order.push([bottom, c]);
      }
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        if (r * cols + left < len) order.push([r, left]);
      }
      left++;
    }
  }
  // Fill grid from text in spiral order
  for (let i = 0; i < len && i < order.length; i++) {
    const [r, c] = order[i];
    grid[r][c] = text[i];
  }
  // Read row by row
  const result: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null) result.push(grid[r][c] as string);
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const cols = Math.max(2, parseInt((params.cols as string) || '4', 10));
      return mode === 'decrypt' ? decrypt(input, cols) : encrypt(input, cols);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'cols', label: '列数', type: 'text', placeholder: '4', default: '4' },
    ]}
  />
);

export default ToolComponent;
