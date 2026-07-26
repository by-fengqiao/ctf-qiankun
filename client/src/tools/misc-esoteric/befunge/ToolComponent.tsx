import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

type Dir = [number, number];

function befunge(code: string, input: string): string {
  const grid: string[][] = code.split('\n').map((line: string) => line.split(''));
  const rows = grid.length;
  const cols = Math.max(...grid.map((r: string[]) => r.length), 1);
  for (const row of grid) {
    while (row.length < cols) row.push(' ');
  }

  let x = 0;
  let y = 0;
  let dir: Dir = [1, 0];
  const stack: number[] = [];
  let output = '';
  let inputIdx = 0;
  let stringMode = false;
  let steps = 0;
  const maxSteps = 1000000;

  while (steps++ < maxSteps) {
    if (y >= rows || x >= cols) break;
    let ch = grid[y]?.[x] ?? ' ';
    if (stringMode && ch !== '"') {
      stack.push(ch.charCodeAt(0));
      x = (x + dir[0] + cols) % cols;
      y = (y + dir[1] + rows) % rows;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      stack.push(parseInt(ch, 10));
    } else if (ch === '+') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      stack.push(b + a);
    } else if (ch === '-') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      stack.push(b - a);
    } else if (ch === '*') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      stack.push(b * a);
    } else if (ch === '/') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      if (a === 0) throw new Error('除零错误');
      stack.push(Math.trunc(b / a));
    } else if (ch === '%') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      if (a === 0) throw new Error('模零错误');
      stack.push(b % a);
    } else if (ch === '!') {
      const a = stack.pop() ?? 0;
      stack.push(a === 0 ? 1 : 0);
    } else if (ch === '`') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      stack.push(b > a ? 1 : 0);
    } else if (ch === '>') {
      dir = [1, 0];
    } else if (ch === '<') {
      dir = [-1, 0];
    } else if (ch === '^') {
      dir = [0, -1];
    } else if (ch === 'v') {
      dir = [0, 1];
    } else if (ch === '?') {
      const dirs: Dir[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      dir = dirs[Math.floor(Math.random() * 4)];
    } else if (ch === '_') {
      const v = stack.pop() ?? 0;
      dir = v === 0 ? [1, 0] : [-1, 0];
    } else if (ch === '|') {
      const v = stack.pop() ?? 0;
      dir = v === 0 ? [0, 1] : [0, -1];
    } else if (ch === '"') {
      stringMode = !stringMode;
    } else if (ch === ':') {
      const v = stack.pop() ?? 0;
      stack.push(v, v);
    } else if (ch === '\\') {
      const a = stack.pop() ?? 0;
      const b = stack.pop() ?? 0;
      stack.push(a, b);
    } else if (ch === '$') {
      stack.pop();
    } else if (ch === '.') {
      const v = stack.pop() ?? 0;
      output += `${v} `;
    } else if (ch === ',') {
      const v = stack.pop() ?? 0;
      output += String.fromCharCode(v & 0xff);
    } else if (ch === '#') {
      x = (x + dir[0] + cols) % cols;
      y = (y + dir[1] + rows) % rows;
    } else if (ch === 'g') {
      const gy = stack.pop() ?? 0;
      const gx = stack.pop() ?? 0;
      const cell = grid[gy]?.[gx] ?? ' ';
      stack.push(cell.charCodeAt(0));
    } else if (ch === 'p') {
      const py = stack.pop() ?? 0;
      const px = stack.pop() ?? 0;
      const pv = stack.pop() ?? 0;
      if (grid[py]) grid[py][px] = String.fromCharCode(pv & 0xff);
    } else if (ch === '&') {
      const numMatch = input.substring(inputIdx).match(/^-?\d+/);
      if (numMatch) {
        stack.push(parseInt(numMatch[0], 10));
        inputIdx += numMatch[0].length;
      } else {
        stack.push(0);
      }
    } else if (ch === '~') {
      stack.push(inputIdx < input.length ? input.charCodeAt(inputIdx++) : 0);
    } else if (ch === '@') {
      break;
    }

    x = (x + dir[0] + cols) % cols;
    y = (y + dir[1] + rows) % rows;
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parts = input.split('\n');
      const code = parts[0] || '';
      const inputData = parts.slice(1).join('\n');
      return befunge(code, inputData);
    }}
  />
);

export default ToolComponent;
