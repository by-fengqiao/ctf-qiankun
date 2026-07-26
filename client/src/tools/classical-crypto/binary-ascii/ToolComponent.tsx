import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  return Array.from(bytes, (b: number) => b.toString(2).padStart(8, '0')).join(' ');
};

const decode = (input: string): string => {
  const tokens = input.trim().split(/\s+/);
  const bytes: number[] = [];
  for (const tok of tokens) {
    if (/^[01]+$/.test(tok)) {
      const padded = tok.length === 8 ? tok : tok.padStart(8, '0');
      bytes.push(parseInt(padded, 2));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
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
