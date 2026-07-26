import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

interface StackSlot {
  name: string;
  size: number;
  raw: string;
}

const KNOWN_WORDS = [
  'return', 'ret', 'return_addr', 'return_address', 'ret_addr',
  'saved_rbp', 'rbp', 'saved_ebp', 'ebp', 'saved_rbp_',
  'canary', 'stack_cookie', 'cookie', 'gs_cookie',
  'buffer', 'buf', 'var', 'local', 'arg', 'param', 'args',
  'saved_rip', 'rip', 'eip',
];

const classify = (name: string): string => {
  const n = name.toLowerCase();
  if (/(^|_)?(return|ret|saved_rip|rip|eip)(_|$)?/.test(n) && !n.includes('rbp') && !n.includes('ebp')) {
    return '📌 返回地址';
  }
  if (/(saved_)?r?bp|saved_ebp/.test(n)) return '🔒 保存的帧指针 (RBP)';
  if (/canary|cookie/.test(n)) return '🛡️ Canary (栈保护)';
  if (/^(arg|param|args)/.test(n)) return '📥 函数参数';
  if (/^(buf|buffer)/.test(n)) return '📦 缓冲区';
  if (KNOWN_WORDS.includes(n)) return '局部变量';
  return '局部变量';
};

const parseLayout = (input: string, wordSize: number): StackSlot[] => {
  const tokens = input
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return [];
  return tokens.map((tok) => {
    const m = tok.match(/^([^:]+):(\s*\d+)?$/);
    if (m) {
      const name = m[1].trim();
      const sz = m[2] ? parseInt(m[2].trim(), 10) : wordSize;
      return { name, size: sz > 0 ? sz : wordSize, raw: tok };
    }
    // freeform token without colon → default word size
    return { name: tok.replace(/\s+/g, '_'), size: wordSize, raw: tok };
  });
};

const formatSize = (size: number): string => {
  if (size >= 1024) return `${(size / 1024).toFixed(2)}KB`;
  return `${size}B`;
};

const padRight = (s: string, w: number): string =>
  s.length >= w ? s : s + ' '.repeat(w - s.length);

const hex = (n: number): string => '0x' + n.toString(16);

const render = (input: string, is64: boolean): string => {
  const wordSize = is64 ? 8 : 4;
  const slots = parseLayout(input, wordSize);
  if (slots.length === 0) {
    return '请输入栈布局描述, 例如:\n  buffer:64, canary:8, saved_rbp:8, return_addr:8\n或自由文本 (每项以逗号分隔)。';
  }
  const baseAddr = is64 ? 0x7fffffffe000 : 0xffffd000;
  let cursor = baseAddr;
  // first item = highest address (top)
  const rows = slots.map((slot) => {
    const top = cursor;
    const bottom = cursor - slot.size + 1;
    cursor = cursor - slot.size;
    return { slot, top, bottom };
  });

  const nameW = 18;
  const sizeW = 8;
  const addrW = 12;
  const noteW = 22;

  const innerWidth =
    nameW + sizeW + addrW + noteW + 8; // padding/separators

  const top = '┌' + '─'.repeat(innerWidth) + '┐  ← 高地址';
  const bot = '└' + '─'.repeat(innerWidth) + '┘  ← 低地址';
  const sep = '├' + '─'.repeat(innerWidth) + '┤';

  const L: string[] = [];
  L.push('');
  L.push(`栈帧布局 (${is64 ? 'x86-64' : 'x86 32位'}, 栈向下增长)`);
  L.push('');
  L.push(top);
  rows.forEach((r, idx) => {
    const name = padRight(r.slot.name, nameW);
    const sz = padRight(formatSize(r.slot.size), sizeW);
    const addr = padRight(hex(r.top), addrW);
    const note = padRight(classify(r.slot.name), noteW);
    L.push(`│ ${name} ${sz} ${addr} ${note} │`);
    if (idx < rows.length - 1) L.push(sep);
  });
  L.push(bot);
  L.push('');

  // summary
  const total = slots.reduce((s, x) => s + x.size, 0);
  L.push(`栈帧总大小: ${total} 字节 (${formatSize(total)})`);
  L.push(`栈槽数量: ${slots.length}`);
  L.push('');

  // annotations
  L.push('字段标注:');
  const flags = new Set<string>();
  slots.forEach((s) => flags.add(classify(s.name)));
  flags.forEach((f) => L.push(`  ${f}`));
  L.push('');
  L.push('提示: 列表中第一项位于栈顶 (高地址), 最后一项位于栈底 (低地址)。');
  L.push('      地址为示意基址, 实际运行时由 rsp/rbp 决定。');
  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="栈布局可视化"
    paramsConfig={[
      {
        name: 'arch',
        label: '架构',
        type: 'select',
        default: '64',
        options: [
          { value: '64', label: '64位' },
          { value: '32', label: '32位' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const is64 = (params.arch as string) !== '32';
      return render(input, is64);
    }}
  />
);
export default ToolComponent;
