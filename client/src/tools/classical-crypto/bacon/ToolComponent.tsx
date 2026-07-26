import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const BACON_MAP: Record<string, string> = {
  A: 'AAAAA', B: 'AAAAB', C: 'AAABA', D: 'AAABB', E: 'AABAA',
  F: 'AABAB', G: 'AABBA', H: 'AABBB', I: 'ABAAA', J: 'ABAAB',
  K: 'ABABA', L: 'ABABB', M: 'ABBAA', N: 'ABBAB', O: 'ABBBA',
  P: 'ABBBB', Q: 'BAAAA', R: 'BAAAB', S: 'BAABA', T: 'BAABB',
  U: 'BABAA', V: 'BABAB', W: 'BABBA', X: 'BABBB', Y: 'BBAAA', Z: 'BBAAB',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(BACON_MAP).map(([k, v]: [string, string]) => [v, k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      result.push(BACON_MAP[ch] ?? ch);
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const cleaned = input.replace(/[^ABab]/g, '').toUpperCase();
  const result: string[] = [];
  for (let i = 0; i < cleaned.length; i += 5) {
    const chunk = cleaned.slice(i, i + 5);
    if (chunk.length === 5) {
      result.push(REVERSE_MAP[chunk] ?? '?');
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
