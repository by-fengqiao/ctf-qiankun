import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function encodeBeast(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.codePointAt(0)!;
    const hex = code.toString(16).padStart(4, '0');
    for (const h of hex) {
      const nibble = parseInt(h, 16);
      const binary = nibble.toString(2).padStart(4, '0');
      const beasts = ['嗷', '呜', '啊', '呃'];
      for (const bit of binary) {
        result += beasts[bit === '1' ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2)];
      }
      result += '~';
    }
    result += '！';
  }
  return result;
}

function decodeBeast(text: string): string {
  const cleanText = text.replace(/[^嗷呜啊呃~！]/g, '');
  const chars = [...cleanText];
  let result = '';
  let binaryStr = '';
  let hexStr = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '嗷' || ch === '呜') binaryStr += '0';
    else if (ch === '啊' || ch === '呃') binaryStr += '1';

    if (ch === '~') {
      while (binaryStr.length % 4 !== 0) binaryStr += '0';
      for (let j = 0; j + 4 <= binaryStr.length; j += 4) {
        hexStr += parseInt(binaryStr.slice(j, j + 4), 2).toString(16);
      }
      binaryStr = '';
    }

    if (ch === '！' && hexStr.length >= 4) {
      const code = parseInt(hexStr.slice(0, 4), 16);
      result += String.fromCodePoint(code);
      hexStr = '';
    }
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeBeast(input);
      return encodeBeast(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
