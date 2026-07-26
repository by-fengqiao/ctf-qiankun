import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// Book cipher: use input text as the "book"
// Encrypt: for each plaintext letter, find a position in the book where that letter appears
// Output: word index, character index (1-based)
const encrypt = (input: string, book: string): string => {
  const words = book.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '错误: 书本内容为空';
  const plain = input.toUpperCase().replace(/[^A-Z ]/g, '');
  const result: string[] = [];
  for (const ch of plain) {
    if (ch === ' ') {
      result.push('-');
      continue;
    }
    // Find a word containing this letter
    let found = false;
    const startIdx = Math.floor(Math.random() * words.length);
    for (let i = 0; i < words.length; i++) {
      const idx = (startIdx + i) % words.length;
      const word = words[idx].toUpperCase();
      const charIdx = word.indexOf(ch);
      if (charIdx !== -1) {
        result.push(`${idx + 1},${charIdx + 1}`);
        found = true;
        break;
      }
    }
    if (!found) result.push('?');
  }
  return result.join(' ');
};

const decrypt = (input: string, book: string): string => {
  const words = book.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '错误: 书本内容为空';
  const tokens = input.trim().split(/\s+/);
  const result: string[] = [];
  for (const tok of tokens) {
    if (tok === '-') {
      result.push(' ');
      continue;
    }
    const parts = tok.split(',');
    if (parts.length === 2) {
      const wordIdx = parseInt(parts[0], 10) - 1;
      const charIdx = parseInt(parts[1], 10) - 1;
      if (wordIdx >= 0 && wordIdx < words.length) {
        const word = words[wordIdx].toUpperCase();
        if (charIdx >= 0 && charIdx < word.length) {
          result.push(word[charIdx] ?? '?');
        } else {
          result.push('?');
        }
      } else {
        result.push('?');
      }
    }
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      // For this tool, the "input" box serves as the plaintext/ciphertext
      // The book text needs to be provided. We use a default book if none in params.
      // Since SimpleTool doesn't have a separate book input, we use a built-in excerpt
      const defaultBook = 'The quick brown fox jumps over the lazy dog. ' +
        'Pack my box with five dozen liquor jugs. ' +
        'Sphinx of black quartz judge my vow. ' +
        'How vexingly quick daft zebras jump.';
      return mode === 'decrypt' ? decrypt(input, defaultBook) : encrypt(input, defaultBook);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
  />
);

export default ToolComponent;
