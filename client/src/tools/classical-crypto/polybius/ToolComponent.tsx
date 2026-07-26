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

const encode = (input: string, square: string[]): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase().replace(/J/g, 'I')) {
    if (ch >= 'A' && ch <= 'Z') {
      const idx = square.indexOf(ch);
      if (idx >= 0) {
        result.push(`${Math.floor(idx / 5) + 1}${(idx % 5) + 1}`);
      }
    }
  }
  return result.join(' ');
};

const decode = (input: string, square: string[]): string => {
  const tokens = input.trim().split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    if (/^\d{2}$/.test(tok)) {
      const r = parseInt(tok[0], 10) - 1;
      const c = parseInt(tok[1], 10) - 1;
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
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
      const square = buildSquare(key);
      return mode === 'decode' ? decode(input, square) : encode(input, square);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥(可选)', type: 'text', placeholder: '留空使用标准方阵', default: '' },
    ]}
  />
);

export default ToolComponent;
