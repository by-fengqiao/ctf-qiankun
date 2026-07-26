import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const COLOR_MAP: Record<string, number> = {
  RR: 0, RL: 1, RY: 2,
  LR: 3, LL: 4, LY: 5,
  YR: 6, YL: 7, YY: 8,
  BB: 9, BD: 10, BM: 11,
  DB: 12, DD: 13, DM: 14,
  MB: 15, MD: 16, MM: 17,
};

const HUE_NAMES = ['红', '黄', '绿', '青', '蓝', '紫'];
const LIGHT_NAMES = ['浅', '正', '深'];

function pietTextExecute(code: string, input: string): string {
  const tokens = code.trim().split(/\s+/).filter((t: string) => t.length > 0);
  if (tokens.length === 0) return '';

  const stack: number[] = [];
  let dp = 0;
  let output = '';
  let inputIdx = 0;
  let prevColor = -1;
  let step = 0;

  for (const token of tokens) {
    if (++step > 100000) throw new Error('执行超时');

    if (/^\d+$/.test(token)) {
      stack.push(parseInt(token, 10));
      prevColor = -1;
      continue;
    }

    const colorIdx = COLOR_MAP[token.toUpperCase()];
    if (colorIdx !== undefined) {
      if (prevColor >= 0) {
        const prevHue = Math.floor(prevColor / 3);
        const prevLight = prevColor % 3;
        const curHue = Math.floor(colorIdx / 3);
        const curLight = colorIdx % 3;
        let hueDiff = (curHue - prevHue + 6) % 6;
        let lightDiff = (curLight - prevLight + 3) % 3;

        switch (hueDiff) {
          case 0:
            switch (lightDiff) {
              case 0: break;
              case 1: dp = (dp + 1) % 4; break;
              case 2: dp = (dp + 3) % 4; break;
            }
            break;
          case 1:
            stack.push(stack.pop() ?? 0 + 1);
            break;
          case 2:
            const a = stack.pop() ?? 0;
            const b = stack.pop() ?? 0;
            stack.push(b + a);
            break;
          case 3: {
            const a2 = stack.pop() ?? 0;
            const b2 = stack.pop() ?? 0;
            stack.push(b2 - a2);
            break;
          }
          case 4: {
            const a4 = stack.pop() ?? 0;
            const b4 = stack.pop() ?? 0;
            if (a4 !== 0) stack.push(b4 > a4 ? 1 : 0);
            break;
          }
          case 5: {
            const a5 = stack.pop() ?? 0;
            const b5 = stack.pop() ?? 0;
            if (a5 !== 0) stack.push(Math.trunc(b5 / a5));
            break;
          }
        }
      }
      prevColor = colorIdx;
      continue;
    }

    switch (token.toUpperCase()) {
      case 'PUSH': case 'P': {
        const v = stack.pop() ?? 0;
        output += String.fromCharCode(v & 0xff);
        break;
      }
      case 'POP': stack.pop(); break;
      case 'ADD': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; stack.push(a + b); break; }
      case 'SUB': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; stack.push(b - a); break; }
      case 'MUL': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; stack.push(b * a); break; }
      case 'DIV': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; if (a === 0) throw new Error('除零'); stack.push(Math.trunc(b / a)); break; }
      case 'MOD': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; if (a === 0) throw new Error('模零'); stack.push(b % a); break; }
      case 'NOT': { const v = stack.pop() ?? 0; stack.push(v === 0 ? 1 : 0); break; }
      case 'GT': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; stack.push(b > a ? 1 : 0); break; }
      case 'DUP': { const v = stack.pop() ?? 0; stack.push(v, v); break; }
      case 'SWP': { const a = stack.pop() ?? 0; const b = stack.pop() ?? 0; stack.push(a, b); break; }
      case 'INN': {
        const numMatch = input.substring(inputIdx).match(/^-?\d+/);
        if (numMatch) { stack.push(parseInt(numMatch[0], 10)); inputIdx += numMatch[0].length; }
        else stack.push(0);
        break;
      }
      case 'INC': {
        stack.push(inputIdx < input.length ? input.charCodeAt(inputIdx++) : 0);
        break;
      }
      case 'OUTN': { output += `${stack.pop() ?? 0}`; break; }
      case 'OUTC': { const v = stack.pop() ?? 0; output += String.fromCharCode(v & 0xff); break; }
      case 'HALT': return output;
      default:
        break;
    }
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parts = input.split('\n');
      const code = parts[0] || '';
      const inputData = parts.slice(1).join('\n');
      return pietTextExecute(code, inputData);
    }}
  />
);

export default ToolComponent;
