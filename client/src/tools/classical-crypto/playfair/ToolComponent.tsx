import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const buildGrid = (key: string): string[] => {
  const seen = new Set<string>();
  const grid: string[] = [];
  const add = (ch: string) => {
    const c = ch === 'J' ? 'I' : ch;
    if (!seen.has(c)) {
      seen.add(c);
      grid.push(c);
    }
  };
  for (const ch of key.toUpperCase().replace(/[^A-Z]/g, '')) {
    add(ch);
  }
  for (let i = 0; i < 26; i++) {
    add(String.fromCharCode(65 + i));
  }
  return grid;
};

const findPos = (grid: string[], ch: string): [number, number] => {
  const idx = grid.indexOf(ch);
  return [Math.floor(idx / 5), idx % 5];
};

const process = (input: string, key: string, decrypt: boolean): string => {
  const grid = buildGrid(key);
  const text = input.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const digraphs: string[] = [];
  if (decrypt) {
    // Decrypt: simply group into pairs of 2, no X insertion
    for (let i = 0; i + 1 < text.length; i += 2) {
      digraphs.push(text[i] + text[i + 1]);
    }
  } else {
    // Encrypt: split into digraphs, insert X between duplicates, pad odd length
    let i = 0;
    while (i < text.length) {
      const a = text[i];
      let b = text[i + 1] ?? 'X';
      if (a === b) {
        digraphs.push(a + 'X');
        i++;
      } else {
        digraphs.push(a + b);
        i += 2;
      }
    }
    if (digraphs.length > 0) {
      const last = digraphs[digraphs.length - 1];
      if (last.length === 1) digraphs[digraphs.length - 1] = last + 'X';
    }
  }
  const result: string[] = [];
  for (const d of digraphs) {
    const [r1, c1] = findPos(grid, d[0]);
    const [r2, c2] = findPos(grid, d[1]);
    let nr1: number, nc1: number, nr2: number, nc2: number;
    if (r1 === r2) {
      nc1 = (c1 + (decrypt ? 4 : 1)) % 5;
      nc2 = (c2 + (decrypt ? 4 : 1)) % 5;
      nr1 = nr2 = r1;
    } else if (c1 === c2) {
      nr1 = (r1 + (decrypt ? 4 : 1)) % 5;
      nr2 = (r2 + (decrypt ? 4 : 1)) % 5;
      nc1 = nc2 = c1;
    } else {
      nr1 = r1; nc1 = c2;
      nr2 = r2; nc2 = c1;
    }
    result.push(grid[nr1 * 5 + nc1] + grid[nr2 * 5 + nc2]);
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'PLAYFAIR';
      return process(input, key, mode === 'decrypt');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥', type: 'text', placeholder: 'PLAYFAIR', default: 'PLAYFAIR' },
    ]}
  />
);

export default ToolComponent;
