import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ARROWS = ['←', '→', '↑', '↓'];
const ARROW_MAP: Record<string, number> = { '←': 0, '→': 1, '↑': 2, '↓': 3 };

function encodeToArrows(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const result: string[] = [];
  for (const byte of bytes) {
    for (let shift = 6; shift >= 0; shift -= 2) {
      const bits = (byte >> shift) & 0b11;
      result.push(ARROWS[bits]);
    }
  }
  return result.join('');
}

function decodeFromArrows(text: string): string {
  const arrows = [...text].filter((ch: string) => ARROW_MAP[ch] !== undefined);
  if (arrows.length % 4 !== 0) {
    throw new Error('箭头数量必须是 4 的倍数（每个字节 4 个箭头）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < arrows.length; i += 4) {
    let byte = 0;
    for (let j = 0; j < 4; j++) {
      byte = (byte << 2) | ARROW_MAP[arrows[i + j]];
    }
    bytes.push(byte);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：箭头序列无效';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromArrows(input);
      return encodeToArrows(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
