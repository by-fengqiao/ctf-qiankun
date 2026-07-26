import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MALBOlGE_CHARS = new Set([
  '(', '<', '`', '#', ']', '~', '6', 'Z', 'Y', '3', '2', 'V', 'x', '/',
  '4', 'R', 's', '+', 'p', '0', ':', 'n', '^', '$', 'P', 'q', 'c', 'C', 'Q',
  ')', '&', 'v', 'k', 'g', 'm', 'H', 'K', '8', 'd', 'b', 'E', '{', 'w', 'i',
  'X', 'u', 'y', 'T', 'f', 'Y', '!', '-', '|', 'I', '*', ',', '~', 'i', '@',
  'j', 'J', 'l', 'o', 'r', '%', '(', '>', '&', '9', 'e', '1', 'D',
]);

const xlat1 = '+b(29e*j1VMEKLyC})8&m#~W>qxdRp%wotU4-[ YcL&vZ2{g:_crC<y1aq/9j27b'
  .split('').map((c: string) => c.charCodeAt(0) - 33);
const xlat2 = '5z]&gqtyfr$(9j27bwe&vZ2{g:_crC<y1aq/9j27bwe&vZ2{g:_crC<y1aq/9j2'
  .split('').map((c: string) => c.charCodeAt(0) - 33);

function malbolgeAnalyze(code: string): string {
  const lines: string[] = [];

  const stripped = code.replace(/[^ -~]/g, '');
  const validChars = stripped.split('').filter((c: string) => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126);

  let malbolgeCount = 0;
  let otherCount = 0;
  for (const ch of validChars) {
    if (MALBOlGE_CHARS.has(ch)) malbolgeCount++;
    else otherCount++;
  }

  const isLikelyMalbolge = malbolgeCount / validChars.length > 0.7;

  lines.push('=== Malbolge 程序分析 ===');
  lines.push(`总字符数: ${validChars.length}`);
  lines.push(`有效 Malbolge 字符: ${malbolgeCount}`);
  lines.push(`其他可打印字符: ${otherCount}`);
  lines.push(`判定: ${isLikelyMalbolge ? '很可能是 Malbolge 程序' : '可能不是 Malbolge 程序'}`);

  if (validChars.length > 0) {
    const mem: number[] = new Array(validChars.length);
    for (let i = 0; i < validChars.length; i++) {
      const c = validChars[i].charCodeAt(0) - 33;
      mem[i] = c;
    }

    lines.push('');
    lines.push('--- 内存映像 (前20个值) ---');
    const preview = mem.slice(0, 20).map((v: number, i: number) => `[${i}]=${v}`).join(' ');
    lines.push(preview);

    if (mem.length >= 2) {
      lines.push('');
      lines.push('--- 第一条指令预览 ---');
      const c0 = validChars[0].charCodeAt(0);
      const normalized = (c0 - 33 + 0) % 94;
      const opTable: Record<number, string> = {
        4: 'jmp', 5: 'out', 23: 'in', 40: 'rot', 39: 'crz',
        62: 'nop', 68: 'nop', 81: 'halt',
      };
      const op = opTable[normalized] ?? `未知操作(${normalized})`;
      lines.push(`指令字符: '${validChars[0]}' (ASCII ${c0})`);
      lines.push(`归一化操作码: ${normalized} → ${op}`);
    }

    lines.push('');
    lines.push('--- XLAT 变换表预览 ---');
    const xlatPreview = xlat1.slice(0, 10).join(', ');
    const xlat2Preview = xlat2.slice(0, 10).join(', ');
    lines.push(`xlat1 前10项: ${xlatPreview}`);
    lines.push(`xlat2 前10项: ${xlat2Preview}`);
  }

  lines.push('');
  lines.push('注: Malbolge 是最难编程的语言之一。');
  lines.push('本工具仅做静态分析，完整执行极其复杂。');

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => malbolgeAnalyze(input)}
  />
);

export default ToolComponent;
