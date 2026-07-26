import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input) {
    const lower = ch.toLowerCase();
    if (lower >= 'a' && lower <= 'z') {
      result.push(String(lower.charCodeAt(0) - 96));
    } else if (ch === ' ') {
      result.push('-');
    } else {
      result.push(ch);
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const tokens = input.trim().split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    if (tok === '-') {
      result.push(' ');
    } else if (/^\d+$/.test(tok)) {
      const n = parseInt(tok, 10);
      if (n >= 1 && n <= 26) {
        result.push(String.fromCharCode(n + 96));
      } else {
        result.push(tok);
      }
    } else {
      result.push(tok);
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
