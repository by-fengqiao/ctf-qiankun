import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// 5x5 grid: K omitted, C=K. Rows/cols 1-indexed.
const GRID = 'ABCDEFGHIJLMNOPQRSTUVWXYZ';

const charToCoord = (ch: string): [number, number] | null => {
  const upper = ch.toUpperCase();
  const idx = GRID.indexOf(upper);
  if (idx === -1) return null;
  return [Math.floor(idx / 5) + 1, (idx % 5) + 1];
};

const coordToChar = (row: number, col: number): string => {
  if (row < 1 || row > 5 || col < 1 || col > 5) return '?';
  return GRID[(row - 1) * 5 + (col - 1)] ?? '?';
};

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input) {
    const coord = charToCoord(ch);
    if (coord) {
      const [r, c] = coord;
      result.push(`${'.'.repeat(r)} ${'.'.repeat(c)}`);
    }
  }
  return result.join('  ');
};

const decode = (input: string): string => {
  const pairs = input.trim().split(/\s{2,}/);
  const result: string[] = [];
  for (const pair of pairs) {
    const parts = pair.split(/\s+/).filter(Boolean);
    if (parts.length === 2) {
      const r = parts[0].length;
      const c = parts[1].length;
      if (r >= 1 && r <= 5 && c >= 1 && c <= 5) {
        result.push(coordToChar(r, c));
      }
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) =>
      mode === 'encode' ? encode(input) : decode(input)
    }
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
