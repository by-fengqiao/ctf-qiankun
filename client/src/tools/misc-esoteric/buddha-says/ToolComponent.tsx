import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const BUDDHA_CHARS = '弥陀佛阿舍利般若波罗蜜多心经菩提'.split('');
const KEY = '佛曰：';

function encodeBuddha(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let result = KEY;
  for (const b of bytes) {
    result += BUDDHA_CHARS[(b >> 4) & 0x0f];
    result += BUDDHA_CHARS[b & 0x0f];
  }
  return result;
}

function decodeBuddha(text: string): string {
  let content = text.trim();
  if (content.startsWith(KEY)) content = content.substring(KEY.length);
  else if (content.startsWith('佛言：')) content = content.substring(3);
  else if (content.startsWith('佛曰')) content = content.substring(2);

  const charMap: Record<string, number> = {};
  BUDDHA_CHARS.forEach((c: string, i: number) => { charMap[c] = i; });

  const nibbles: number[] = [];
  for (const ch of content) {
    const idx = charMap[ch];
    if (idx !== undefined) nibbles.push(idx);
  }

  const bytes: number[] = [];
  for (let i = 0; i + 1 < nibbles.length; i += 2) {
    bytes.push((nibbles[i] << 4) | nibbles[i + 1]);
  }
  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：可能不是有效的佛曰编码';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeBuddha(input);
      return encodeBuddha(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
