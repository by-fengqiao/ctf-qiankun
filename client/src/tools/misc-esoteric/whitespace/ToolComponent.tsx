import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function whitespace(code: string, input: string): string {
  const filtered = code.replace(/[^ \t\n]/g, '');
  const S = ' ';
  const T = '\t';
  const L = '\n';
  let output = '';
  let inputIdx = 0;
  const stack: number[] = [];
  const heap = new Map<number, number>();
  const labels = new Map<string, number>();
  const callStack: number[] = [];

  // Read a number at position p: sign bit ([S]=+, [T]=-) then binary digits until [L].
  function readNumberAt(p: number): { value: number; next: number } {
    let sign = 1;
    if (filtered[p] === T) sign = -1;
    p++;
    let num = 0;
    while (p < filtered.length && filtered[p] !== L) {
      num = num * 2 + (filtered[p] === T ? 1 : 0);
      p++;
    }
    p++; // skip terminating [L]
    return { value: num * sign, next: p };
  }

  // Read a label at position p: a run of [S]/[T] terminated by [L].
  function readLabelAt(p: number): { label: string; next: number } {
    let label = '';
    while (p < filtered.length && filtered[p] !== L) {
      label += filtered[p];
      p++;
    }
    p++; // skip terminating [L]
    return { label, next: p };
  }

  // Advance past the parameter (number/label) that follows the instruction starting at instrStart.
  function skipParams(instrStart: number): number {
    const c0 = filtered[instrStart];
    const c1 = filtered[instrStart + 1];
    const c2 = filtered[instrStart + 2];
    if (c0 === S) {
      if (c1 === S) return readNumberAt(instrStart + 2).next; // push
      if (c1 === L) {
        if (c2 === S || c2 === T) return readNumberAt(instrStart + 3).next; // copy / slide
      }
      return instrStart + 3; // dup / swap / discard
    }
    if (c0 === T) {
      if (c1 === L) return instrStart + 4; // IO uses two more opcode chars, no params
      return instrStart + 3; // arithmetic / heap
    }
    // c0 === L (flow control): mark/call/jump/jz/jn carry a label; return/end do not.
    if ((c1 === S) || (c1 === T && c2 !== L)) return readLabelAt(instrStart + 2).next;
    return instrStart + 3;
  }

  // Pre-scan: record label -> instruction position right after the mark's label.
  {
    let p = 0;
    while (p < filtered.length) {
      if (filtered[p] === L && filtered[p + 1] === S && filtered[p + 2] === S) {
        const r = readLabelAt(p + 3);
        labels.set(r.label, r.next);
        p = r.next;
      } else {
        const next = skipParams(p);
        p = next > p ? next : p + 1;
      }
    }
  }

  let ip = 0;
  let steps = 0;
  const maxSteps = 5000000;
  while (ip < filtered.length) {
    if (++steps > maxSteps) throw new Error('执行超时');
    const cmd = filtered[ip++];

    if (cmd === S) {
      const sub = filtered[ip++];
      if (sub === S) {
        const r = readNumberAt(ip); // push: number directly follows [S][S]
        ip = r.next;
        stack.push(r.value);
      } else if (sub === T) {
        const type = filtered[ip++];
        if (type === S) {
          stack.push(stack.length ? stack[stack.length - 1] : 0); // dup
        } else if (type === T) {
          if (stack.length >= 2) {
            const a = stack.pop()!;
            const b = stack.pop()!;
            stack.push(a, b); // swap
          }
        } else if (type === L) {
          stack.pop(); // discard
        }
      } else if (sub === L) {
        const type = filtered[ip++];
        const r = readNumberAt(ip);
        ip = r.next;
        if (type === S) {
          const n = r.value;
          const idx = stack.length - 1 - n;
          stack.push(idx >= 0 ? stack[idx] : 0); // copy
        } else if (type === L) {
          const n = r.value; // slide
          if (stack.length > 0) {
            const top = stack.pop()!;
            for (let k = 0; k < n && stack.length > 0; k++) stack.pop();
            stack.push(top);
          }
        }
      }
    } else if (cmd === T) {
      const sub = filtered[ip++];
      if (sub === S) {
        const type = filtered[ip++];
        const a = stack.pop() ?? 0;
        const b = stack.pop() ?? 0;
        if (type === S) stack.push(b + a);
        else if (type === T) stack.push(b - a);
        else if (type === L) stack.push(b * a);
      } else if (sub === T) {
        const type = filtered[ip++];
        if (type === S) {
          const a = stack.pop() ?? 0;
          const b = stack.pop() ?? 0;
          if (a === 0) throw new Error('除零错误');
          stack.push(Math.trunc(b / a));
        } else if (type === T) {
          const a = stack.pop() ?? 0;
          const b = stack.pop() ?? 0;
          if (a === 0) throw new Error('模零错误');
          stack.push(b % a);
        } else if (type === L) {
          const addr = stack.pop() ?? 0;
          stack.push(heap.get(addr) ?? 0); // retrieve
        }
      } else if (sub === L) {
        const type = filtered[ip++];
        const sub2 = filtered[ip++];
        if (type === S) {
          const v = stack.pop() ?? 0;
          if (sub2 === S) output += String.fromCharCode(v);
          else if (sub2 === T) output += `${v}`;
        } else if (type === T) {
          if (sub2 === S) {
            const c = inputIdx < input.length ? input.charCodeAt(inputIdx++) : 0;
            stack.push(c);
          } else if (sub2 === T) {
            const rest = input.substring(inputIdx);
            const match = /^-?\d+/.exec(rest);
            const n = match ? parseInt(match[0], 10) : 0;
            inputIdx += match ? match[0].length : 0;
            stack.push(n);
          }
        }
      }
    } else if (cmd === L) {
      const sub = filtered[ip++];
      const type = filtered[ip++];
      if (sub === S && type === S) {
        readLabelAt(ip); // mark: label already registered in pre-scan
      } else if (sub === S && type === T) {
        const r = readLabelAt(ip); // call
        const target = labels.get(r.label);
        if (target === undefined) throw new Error('未找到标签');
        callStack.push(r.next);
        ip = target;
      } else if (sub === S && type === L) {
        const r = readLabelAt(ip); // jump
        const target = labels.get(r.label);
        if (target === undefined) throw new Error('未找到标签');
        ip = target;
      } else if (sub === T && type === S) {
        const r = readLabelAt(ip); // jump if zero
        const target = labels.get(r.label);
        if (target === undefined) throw new Error('未找到标签');
        const v = stack.pop() ?? 0;
        if (v === 0) ip = target;
      } else if (sub === T && type === T) {
        const r = readLabelAt(ip); // jump if negative
        const target = labels.get(r.label);
        if (target === undefined) throw new Error('未找到标签');
        const v = stack.pop() ?? 0;
        if (v < 0) ip = target;
      } else if (sub === T && type === L) {
        if (callStack.length > 0) ip = callStack.pop()!; // return
        else break;
      } else if (sub === L && type === L) {
        break; // end program
      }
    }
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parts = input.split('\n');
      const code = parts.slice(0, -1).join('\n') + '\n';
      const inputData = parts[parts.length - 1] || '';
      return whitespace(code, inputData);
    }}
  />
);

export default ToolComponent;
