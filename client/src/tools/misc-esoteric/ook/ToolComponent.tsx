import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function ookToBf(code: string): string {
  const tokens = code.match(/Ook[.?!]/g);
  if (!tokens || tokens.length === 0) return '';
  if (tokens.length % 2 !== 0) throw new Error('Ook! 标记数量必须为偶数');
  let bf = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const pair = tokens[i] + tokens[i + 1];
    switch (pair) {
      case 'Ook.Ook?': bf += '>'; break;
      case 'Ook?Ook.': bf += '<'; break;
      case 'Ook.Ook.': bf += '+'; break;
      case 'Ook!Ook!': bf += '-'; break;
      case 'Ook!Ook.': bf += '.'; break;
      case 'Ook.Ook!': bf += ','; break;
      case 'Ook!Ook?': bf += '['; break;
      case 'Ook?Ook!': bf += ']'; break;
      default: throw new Error(`无效的 Ook! 标记对: ${pair}`);
    }
  }
  return bf;
}

function brainfuck(code: string, input: string): string {
  const tape = new Uint8Array(30000);
  let ptr = 0;
  let ip = 0;
  let inputIdx = 0;
  let output = '';
  const brackets = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '[') stack.push(i);
    if (code[i] === ']') {
      const open = stack.pop();
      if (open === undefined) throw new Error('未匹配的 ] 括号');
      brackets.set(open, i);
      brackets.set(i, open);
    }
  }
  let steps = 0;
  const maxSteps = 10000000;
  while (ip < code.length) {
    if (++steps > maxSteps) throw new Error('执行超时');
    switch (code[ip]) {
      case '>': ptr++; break;
      case '<': ptr--; break;
      case '+': tape[ptr] = (tape[ptr] + 1) & 0xff; break;
      case '-': tape[ptr] = (tape[ptr] - 1) & 0xff; break;
      case '.': output += String.fromCharCode(tape[ptr]); break;
      case ',': tape[ptr] = inputIdx < input.length ? input.charCodeAt(inputIdx++) & 0xff : 0; break;
      case '[': if (!tape[ptr]) ip = brackets.get(ip)!; break;
      case ']': if (tape[ptr]) ip = brackets.get(ip)!; break;
    }
    ip++;
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parts = input.split('\n');
      const bf = ookToBf(parts[0] || '');
      const inputData = parts.slice(1).join('\n');
      return brainfuck(bf, inputData);
    }}
  />
);

export default ToolComponent;
