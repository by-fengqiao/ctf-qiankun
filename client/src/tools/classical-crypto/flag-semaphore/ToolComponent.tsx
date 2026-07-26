import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Semaphore: 8 positions around body (like clock face)
// Positions: 1=up, 2=upper-right, 3=right, 4=lower-right, 5=down, 6=lower-left, 7=left, 8=upper-left
const SEMAPHORE_MAP: Record<string, [number, number]> = {
  A: [8, 1], B: [8, 2], C: [8, 3], D: [8, 4], E: [8, 5],
  F: [8, 6], G: [7, 1], H: [7, 2], I: [7, 3], J: [7, 4],
  K: [7, 5] /* also K = J */, L: [7, 6], M: [6, 1], N: [6, 2],
  O: [6, 3], P: [6, 4], Q: [6, 5], R: [6, 6] /* invalid, use below */,
  S: [5, 1], T: [5, 2], U: [5, 3], V: [5, 4], W: [4, 2],
  X: [4, 3], Y: [4, 4], Z: [4, 5],
};

const POS_NAMES: Record<number, string> = {
  1: '↑上', 2: '↗右上', 3: '→右', 4: '↘右下',
  5: '↓下', 6: '↙左下', 7: '←左', 8: '↖左上',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SEMAPHORE_MAP).map(([k, v]: [string, [number, number]]) => {
    const key = [v[0], v[1]].sort().join(',');
    return [key, k];
  }),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch === ' ') {
      result.push('[空格]');
    } else if (SEMAPHORE_MAP[ch]) {
      const [p1, p2] = SEMAPHORE_MAP[ch];
      result.push(`${ch}=(${POS_NAMES[p1] ?? p1}, ${POS_NAMES[p2] ?? p2})`);
    }
  }
  return result.join('  ');
};

const decode = (input: string): string => {
  // Input format: pairs of positions like "8,1 8,2"
  const tokens = input.trim().split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    const nums = tok.split(/[,\s]+/).map((n: string) => parseInt(n, 10));
    if (nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
      const key = [nums[0], nums[1]].sort((a: number, b: number) => a - b).join(',');
      result.push(REVERSE_MAP[key] ?? '?');
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
