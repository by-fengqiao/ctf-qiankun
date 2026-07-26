import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]: [string, string]) => [v, k]),
);

const encode = (input: string): string => {
  const result: string[] = [];
  for (const ch of input.toUpperCase()) {
    if (ch === ' ') {
      result.push('/');
    } else if (MORSE_MAP[ch]) {
      result.push(MORSE_MAP[ch]);
    }
  }
  return result.join(' ');
};

const decode = (input: string): string => {
  const words = input.trim().split(/\s*\/\s*/);
  return words.map((word: string) => {
    return word.split(/\s+/).map((code: string) => REVERSE_MAP[code] ?? '').join('');
  }).join(' ');
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
