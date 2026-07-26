import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const PIGPEN_SYMBOLS: Record<string, string> = {
  A: '⌐', B: '⌜', C: '⌙', D: '⌗', E: '⌖', F: '⌕', G: '⌔', H: '⌓', I: '⌒',
  J: '⌊', K: '⌋', L: '⌉', M: '⌈', N: '⊤', O: '⊥', P: '⊣', Q: '⊢',
  R: '⌝', S: '⌞', T: '⌟', U: '⌎', V: '⌄', W: '⌅', X: '⌁', Y: '⌀', Z: '⌏',
};

const REVERSE_PIGPEN: Record<string, string> = {};
for (const [ch, sym] of Object.entries(PIGPEN_SYMBOLS)) {
  REVERSE_PIGPEN[sym] = ch;
}

function encodePigpen(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const upper = text[i].toUpperCase();
    if (PIGPEN_SYMBOLS[upper]) {
      result += PIGPEN_SYMBOLS[upper];
    } else if (text[i] === ' ') {
      result += '  ';
    } else {
      result += text[i];
    }
  }
  return result;
}

function decodePigpen(text: string): string {
  const chars = [...text];
  let result = '';
  for (const ch of chars) {
    const decoded = REVERSE_PIGPEN[ch];
    if (decoded) {
      result += decoded;
    } else if (ch === ' ') {
      result += ' ';
    } else {
      result += ch;
    }
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodePigpen(input);
      return encodePigpen(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
