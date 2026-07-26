import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const NATO_MAP: Record<string, string> = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
  F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
  K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
  P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(NATO_MAP).map(([k, v]: [string, string]) => [v.toLowerCase(), k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (NATO_MAP[ch]) {
      result.push(NATO_MAP[ch]);
    } else if (ch === ' ') {
      result.push('(space)');
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const tokens = input.split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (REVERSE_MAP[lower]) {
      result.push(REVERSE_MAP[lower]);
    } else if (tok === '(space)') {
      result.push(' ');
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
