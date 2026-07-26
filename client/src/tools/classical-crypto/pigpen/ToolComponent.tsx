import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Pigpen cipher: letters mapped to grid fragments
// Text-based description of pigpen symbols
const SYMBOL_DESC: Record<string, string> = {
  A: '[右上角]', B: '[右下角]', C: '[右完整]',
  D: '[左上角]', E: '[左下角]', F: '[左完整]',
  G: '[上完整]', H: '[下完整]', I: '[中间]',
  J: '[右上角·]', K: '[右下角·]', L: '[右完整·]',
  M: '[左上角·]', N: '[左下角·]', O: '[左完整·]',
  P: '[上完整·]', Q: '[下完整·]', R: '[中间·]',
  S: '[V左上]', T: '[V右上]', U: '[V左下]', V: '[V右下]',
  W: '[V左上·]', X: '[V右上·]', Y: '[V左下·]', Z: '[V右下·]',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_DESC).map(([k, v]: [string, string]) => [v, k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch === ' ') {
      result.push(' ');
    } else if (SYMBOL_DESC[ch]) {
      result.push(SYMBOL_DESC[ch]);
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const tokens = input.split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    if (REVERSE_MAP[tok]) {
      result.push(REVERSE_MAP[tok]);
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
