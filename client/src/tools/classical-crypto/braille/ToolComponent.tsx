import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Unicode Braille patterns: U+2800 + (dot pattern bitmask)
// Dots: 1=top-left, 2=mid-left, 3=bot-left, 4=top-right, 5=mid-right, 6=bot-right
const LETTER_MAP: Record<string, number> = {
  A: 0x01, B: 0x03, C: 0x09, D: 0x19, E: 0x11, F: 0x0B,
  G: 0x1B, H: 0x13, I: 0x0A, J: 0x1A, K: 0x05, L: 0x07,
  M: 0x0D, N: 0x1D, O: 0x15, P: 0x0F, Q: 0x1F, R: 0x17,
  S: 0x0E, T: 0x1E, U: 0x25, V: 0x27, W: 0x3A, X: 0x2D,
  Y: 0x3D, Z: 0x35, ' ': 0x00,
};

const DIGIT_MAP: Record<string, number> = {
  '1': 0x01, '2': 0x03, '3': 0x09, '4': 0x19, '5': 0x11,
  '6': 0x0B, '7': 0x1B, '8': 0x13, '9': 0x0A, '0': 0x1A,
};

const DIGIT_PREFIX = 0x3C; // ⠼

const LETTER_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(LETTER_MAP).map(([k, v]: [string, number]) => [v, k]),
);

const DIGIT_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(DIGIT_MAP).map(([k, v]: [string, number]) => [v, k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch in DIGIT_MAP) {
      result.push(String.fromCharCode(0x2800 + DIGIT_PREFIX));
      result.push(String.fromCharCode(0x2800 + DIGIT_MAP[ch]));
    } else if (ch in LETTER_MAP) {
      result.push(String.fromCharCode(0x2800 + LETTER_MAP[ch]));
    }
  }
  return result.join('');
};

const decode = (input: string): string => {
  const result: string[] = [];
  let digitMode = false;
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code >= 0x2800 && code <= 0x28FF) {
      const bits = code - 0x2800;
      if (bits === DIGIT_PREFIX) {
        digitMode = true;
        continue;
      }
      if (bits === 0x00) {
        // space resets digit mode
        digitMode = false;
        result.push(' ');
      } else if (digitMode) {
        result.push(DIGIT_REVERSE[bits] ?? '?');
        digitMode = false;
      } else {
        result.push(LETTER_REVERSE[bits] ?? '?');
      }
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
