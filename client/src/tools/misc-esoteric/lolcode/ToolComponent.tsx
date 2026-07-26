import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function lolcode(code: string): string {
  const lines = code.split('\n');
  const vars = new Map<string, string>();
  let output = '';
  let inProgram = false;
  let ended = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') continue;
    if (ended) break;

    const upperLine = line.toUpperCase();

    if (upperLine.startsWith('HAI')) {
      inProgram = true;
      continue;
    }
    if (!inProgram) continue;

    if (upperLine.startsWith('KTHXBYE') || upperLine === 'KTHXBYE') {
      ended = true;
      break;
    }

    if (upperLine.startsWith('VISIBLE ')) {
      let expr = line.substring(8);
      expr = expr.replace(/!+$/, '');
      const match = expr.match(/^"(.*)"$/);
      if (match) {
        let text = match[1];
        text = text.replace(/:\)/g, '\n');
        text = text.replace(/:>/g, '\t');
        text = text.replace(/::/g, ':');
        output += text + '\n';
      } else {
        const tokens = expr.split(/\s+/);
        const parts: string[] = [];
        for (const token of tokens) {
          if (token.startsWith('"') && token.endsWith('"')) {
            parts.push(token.slice(1, -1));
          } else if (/^-?\d+$/.test(token)) {
            parts.push(token);
          } else if (vars.has(token)) {
            parts.push(vars.get(token)!);
          } else if (token === 'WIN') {
            parts.push('WIN');
          } else if (token === 'FAIL') {
            parts.push('FAIL');
          } else {
            parts.push(token);
          }
        }
        output += parts.join(' ') + '\n';
      }
      continue;
    }

    const assignMatch = line.match(/^(?:I\s+HAS\s+A\s+)?(\w+)\s+(?:R|IZ)\s+(.+)$/i);
    if (assignMatch) {
      const varName = assignMatch[1];
      let value = assignMatch[2].trim();
      const strMatch = value.match(/^"(.*)"$/);
      if (strMatch) {
        value = strMatch[1];
      } else if (/^-?\d+$/.test(value)) {
        // keep numeric
      } else if (value.toUpperCase() === 'WIN') {
        value = 'WIN';
      } else if (value.toUpperCase() === 'FAIL') {
        value = 'FAIL';
      }
      vars.set(varName, value);
      continue;
    }
  }

  return output.trimEnd();
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => lolcode(input)}
  />
);

export default ToolComponent;
