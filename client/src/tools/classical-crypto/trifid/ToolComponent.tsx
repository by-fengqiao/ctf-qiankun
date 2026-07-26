import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Trifid uses 3 layers of 3x3 grids = 27 positions (A-Z + ' ')
const buildCube = (key: string): string => {
  const seen = new Set<string>();
  let cube = '';
  const add = (ch: string) => {
    if (!seen.has(ch)) {
      seen.add(ch);
      cube += ch;
    }
  };
  for (const ch of key.toUpperCase()) {
    if (/[A-Z ]/.test(ch)) add(ch);
  }
  const full = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.';
  for (const ch of full) add(ch);
  return cube.padEnd(27, '.').slice(0, 27);
};

const findCoord = (cube: string, ch: string): [number, number, number] => {
  const idx = cube.indexOf(ch);
  if (idx === -1) return [-1, -1, -1];
  return [Math.floor(idx / 9), Math.floor((idx % 9) / 3), idx % 3];
};

const process = (input: string, key: string, period: number, decrypt: boolean): string => {
  const cube = buildCube(key);
  const text = input.toUpperCase().replace(/J/g, 'I');
  const letters = text.replace(/[^A-Z.]/g, '');
  if (letters.length === 0) return '';
  const result: string[] = [];
  for (let start = 0; start < letters.length; start += period) {
    const block = letters.slice(start, start + period);
    const n = block.length;
    const coords: [number, number, number][] = [];
    for (const ch of block) {
      coords.push(findCoord(cube, ch));
    }
    if (decrypt) {
      // Decrypt: interleave [l0,r0,c0,l1,r1,c1,...], split into 3 groups
      const combined: number[] = [];
      for (const [l, r, c] of coords) combined.push(l, r, c);
      for (let i = 0; i < n; i++) {
        const l = combined[i] ?? 0;
        const r = combined[n + i] ?? 0;
        const c = combined[2 * n + i] ?? 0;
        const idx = l * 9 + r * 3 + c;
        result.push(cube[idx] ?? '?');
      }
    } else {
      // Encrypt: concatenate [...layers,...rows,...cols], read triplets
      const layers: number[] = [];
      const rows: number[] = [];
      const cols: number[] = [];
      for (const [l, r, c] of coords) {
        layers.push(l);
        rows.push(r);
        cols.push(c);
      }
      const combined = [...layers, ...rows, ...cols];
      for (let i = 0; i < n; i++) {
        const l = combined[3 * i] ?? 0;
        const r = combined[3 * i + 1] ?? 0;
        const c = combined[3 * i + 2] ?? 0;
        const idx = l * 9 + r * 3 + c;
        result.push(cube[idx] ?? '?');
      }
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || '';
      const period = parseInt((params.period as string) || '5', 10);
      return process(input, key, period, mode === 'decrypt');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥(可选)', type: 'text', placeholder: '留空使用标准立方体', default: '' },
      { name: 'period', label: '周期', type: 'text', placeholder: '5', default: '5' },
    ]}
  />
);

export default ToolComponent;
