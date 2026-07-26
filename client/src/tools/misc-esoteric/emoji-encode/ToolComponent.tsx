import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const EMOJI_BASE = 0x1f600;
const EMOJI_RANGE = 80;

function encodeToEmoji(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const high = (code >> 8) & 0xff;
    const low = code & 0xff;
    result += String.fromCodePoint(EMOJI_BASE + (high % EMOJI_RANGE));
    result += String.fromCodePoint(EMOJI_BASE + (low % EMOJI_RANGE));
    result += String.fromCodePoint(0x1f300 + Math.floor(high / EMOJI_RANGE) * 16 + Math.floor(low / EMOJI_RANGE));
  }
  return result;
}

function decodeFromEmoji(text: string): string {
  const chars = [...text];
  let result = '';
  let i = 0;
  while (i < chars.length) {
    if (i + 2 < chars.length) {
      const cp1 = chars[i].codePointAt(0)!;
      const cp2 = chars[i + 1].codePointAt(0)!;
      const cp3 = chars[i + 2].codePointAt(0)!;
      if (cp1 >= EMOJI_BASE && cp1 < EMOJI_BASE + EMOJI_RANGE &&
          cp2 >= EMOJI_BASE && cp2 < EMOJI_BASE + EMOJI_RANGE &&
          cp3 >= 0x1f300) {
        const high = (cp1 - EMOJI_BASE) + Math.floor((cp3 - 0x1f300) / 16) * EMOJI_RANGE;
        const low = (cp2 - EMOJI_BASE) + ((cp3 - 0x1f300) % 16) * EMOJI_RANGE;
        result += String.fromCharCode((high << 8) | low);
        i += 3;
        continue;
      }
    }
    result += chars[i];
    i++;
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromEmoji(input);
      return encodeToEmoji(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
