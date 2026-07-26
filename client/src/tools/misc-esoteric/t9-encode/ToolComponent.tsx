import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const T9_MAP: Record<string, string> = {
  a: '2', b: '22', c: '222',
  d: '3', e: '33', f: '333',
  g: '4', h: '44', i: '444',
  j: '5', k: '55', l: '555',
  m: '6', n: '66', o: '666',
  p: '7', q: '77', r: '777', s: '7777',
  t: '8', u: '88', v: '888',
  w: '9', x: '99', y: '999', z: '9999',
  ' ': '0',
};

const REVERSE_T9: Record<string, string> = {};
for (const [ch, seq] of Object.entries(T9_MAP)) {
  REVERSE_T9[seq] = ch;
}

function encodeToT9(text: string): string {
  const result: string[] = [];
  let prevKey = '';
  for (let i = 0; i < text.length; i++) {
    const lower = text[i].toLowerCase();
    const seq = T9_MAP[lower];
    if (seq) {
      if (prevKey && seq[0] === prevKey) {
        result.push('|');
      }
      result.push(seq);
      prevKey = seq[0];
    } else {
      result.push(text[i]);
      prevKey = '';
    }
  }
  return result.join(' ');
}

function decodeFromT9(text: string): string {
  const tokens = text.trim().split(/\s+/);
  let result = '';
  for (const token of tokens) {
    if (token === '|') continue;
    const ch = REVERSE_T9[token];
    if (ch !== undefined) {
      result += ch;
    } else {
      result += token;
    }
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromT9(input);
      return encodeToT9(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
