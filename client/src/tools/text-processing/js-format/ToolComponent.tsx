import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      let result = '';
      let indent = 0;
      let inString = false;
      let stringChar = '';
      let inLineComment = false;
      let inBlockComment = false;

      for (let i = 0; i < input.length; i++) {
        const ch: string = input[i];
        const next: string = input[i + 1] ?? '';

        if (inLineComment) {
          result += ch;
          if (ch === '\n') inLineComment = false;
          continue;
        }
        if (inBlockComment) {
          result += ch;
          if (ch === '*' && next === '/') {
            result += next;
            i++;
            inBlockComment = false;
          }
          continue;
        }
        if (inString) {
          result += ch;
          if (ch === '\\' && i + 1 < input.length) {
            result += input[i + 1];
            i++;
            continue;
          }
          if (ch === stringChar) inString = false;
          continue;
        }
        if (ch === '/' && next === '/') {
          inLineComment = true;
          result += ch;
          continue;
        }
        if (ch === '/' && next === '*') {
          inBlockComment = true;
          result += ch;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
          result += ch;
          continue;
        }
        if (ch === '{' || ch === '[') {
          indent++;
          result += ch + '\n' + '  '.repeat(indent);
        } else if (ch === '}' || ch === ']') {
          indent = Math.max(0, indent - 1);
          result = result.replace(/\s+$/u, '');
          result += '\n' + '  '.repeat(indent) + ch;
        } else if (ch === ';') {
          result += ch + '\n' + '  '.repeat(indent);
        } else {
          result += ch;
        }
      }
      result = result.replace(/\n\s*\n/gu, '\n').trim();
      return result;
    }}
  />
);

export default ToolComponent;
