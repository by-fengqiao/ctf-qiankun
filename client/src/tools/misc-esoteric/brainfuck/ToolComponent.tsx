import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function brainfuck(code: string, input: string): string {
  const filtered = code.replace(/[^\+\-\.\,\[\]<>]/g, '');
  const tape = new Uint8Array(30000);
  let ptr = 0;
  let ip = 0;
  let inputIdx = 0;
  let output = '';
  const brackets = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === '[') stack.push(i);
    if (filtered[i] === ']') {
      const open = stack.pop();
      if (open === undefined) throw new Error('未匹配的 ] 括号');
      brackets.set(open, i);
      brackets.set(i, open);
    }
  }
  if (stack.length > 0) throw new Error('未匹配的 [ 括号');
  let steps = 0;
  const maxSteps = 10000000;
  while (ip < filtered.length) {
    if (++steps > maxSteps) throw new Error('执行超时：可能存在无限循环');
    switch (filtered[ip]) {
      case '>': ptr++; break;
      case '<': ptr--; break;
      case '+': tape[ptr] = (tape[ptr] + 1) & 0xff; break;
      case '-': tape[ptr] = (tape[ptr] - 1) & 0xff; break;
      case '.': output += String.fromCharCode(tape[ptr]); break;
      case ',':
        tape[ptr] = inputIdx < input.length ? input.charCodeAt(inputIdx++) & 0xff : 0;
        break;
      case '[': if (!tape[ptr]) ip = brackets.get(ip)!; break;
      case ']': if (tape[ptr]) ip = brackets.get(ip)!; break;
    }
    if (ptr < 0 || ptr >= 30000) throw new Error('指针越界');
    ip++;
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>) => {
      const parts = input.split('\n');
      const code = parts[0] || '';
      const inputData = parts.slice(1).join('\n');
      return brainfuck(code, inputData);
    }}
  />
);

export default ToolComponent;
