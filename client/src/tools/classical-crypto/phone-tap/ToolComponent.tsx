import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// 2=ABC, 3=DEF, 4=GHI, 5=JKL, 6=MNO, 7=PQRS, 8=TUV, 9=WXYZ
const KEY_MAP: Record<string, string> = {
  A: '2', B: '22', C: '222',
  D: '3', E: '33', F: '333',
  G: '4', H: '44', I: '444',
  J: '5', K: '55', L: '555',
  M: '6', N: '66', O: '666',
  P: '7', Q: '77', R: '777', S: '7777',
  T: '8', U: '88', V: '888',
  W: '9', X: '99', Y: '999', Z: '9999',
  ' ': '0',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]: [string, string]) => [v, k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (KEY_MAP[ch]) {
      result.push(KEY_MAP[ch]);
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const tokens = input.trim().split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    if (REVERSE_MAP[tok]) {
      result.push(REVERSE_MAP[tok]);
    } else if (/^\d+$/.test(tok)) {
      result.push('?');
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
