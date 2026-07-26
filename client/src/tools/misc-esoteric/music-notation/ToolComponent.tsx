import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_MAP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function encodeToNotes(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const result: string[] = [];
  for (const byte of bytes) {
    const digits: number[] = [];
    let val = byte;
    for (let i = 0; i < 3; i++) {
      digits.push(val % 7);
      val = Math.floor(val / 7);
    }
    digits.reverse();
    for (const d of digits) {
      result.push(NOTES[d]);
    }
  }
  return result.join(' ');
}

function decodeFromNotes(text: string): string {
  const tokens = text.trim().split(/[\s,]+/).filter((t: string) => t.length > 0);
  if (tokens.length % 3 !== 0) {
    throw new Error('音符数量必须是 3 的倍数（每个字节 3 个音符）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < tokens.length; i += 3) {
    let val = 0;
    for (let j = 0; j < 3; j++) {
      const note = tokens[i + j].charAt(0).toUpperCase();
      const d = NOTE_MAP[note];
      if (d === undefined) throw new Error(`无效音符: ${tokens[i + j]}`);
      val = val * 7 + d;
    }
    bytes.push(val);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：音符序列无效';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromNotes(input);
      return encodeToNotes(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
