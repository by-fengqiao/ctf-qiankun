import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const buildSquare = (key: string): string[] => {
  const seen = new Set<string>();
  const square: string[] = [];
  const add = (ch: string) => {
    const c = ch === 'J' ? 'I' : ch;
    if (!seen.has(c)) {
      seen.add(c);
      square.push(c);
    }
  };
  for (const ch of key.toUpperCase().replace(/[^A-Z]/g, '')) {
    add(ch);
  }
  for (let i = 0; i < 26; i++) {
    add(String.fromCharCode(65 + i));
  }
  return square;
};

const process = (input: string, key: string, period: number, decrypt: boolean): string => {
  const square = buildSquare(key);
  const text = input.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const coords: [number, number][] = [];
  for (const ch of text) {
    const idx = square.indexOf(ch);
    if (idx >= 0) coords.push([Math.floor(idx / 5), idx % 5]);
  }
  if (coords.length === 0) return '';
  // Process in blocks of `period`
  const result: string[] = [];
  for (let start = 0; start < coords.length; start += period) {
    const block = coords.slice(start, start + period);
    if (block.length === 0) continue;
    const rows: number[] = [];
    const cols: number[] = [];
    for (const [r, c] of block) {
      rows.push(r);
      cols.push(c);
    }
    let combined: number[];
    const n = block.length;
    if (decrypt) {
      // Decrypt: interleave [r0,c0,r1,c1,...], then split first n = rows, last n = cols
      combined = [];
      for (const [r, c] of block) combined.push(r, c);
      for (let i = 0; i < n; i++) {
        const r = combined[i];
        const c = combined[n + i];
        result.push(square[r * 5 + c] ?? '?');
      }
    } else {
      // Encrypt: concatenate [...rows,...cols], read pairs (combined[2*i], combined[2*i+1])
      combined = [...rows, ...cols];
      for (let i = 0; i < n; i++) {
        const r = combined[2 * i];
        const c = combined[2 * i + 1];
        result.push(square[r * 5 + c] ?? '?');
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
      { name: 'key', label: '密钥(可选)', type: 'text', placeholder: '留空使用标准方阵', default: '' },
      { name: 'period', label: '周期', type: 'text', placeholder: '5', default: '5' },
    ]}
  />
);

export default ToolComponent;
