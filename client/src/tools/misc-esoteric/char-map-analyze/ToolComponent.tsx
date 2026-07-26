import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function analyzeChars(text: string): string {
  const lines: string[] = [];
  const chars = [...text];

  lines.push('=== 字符映射分析表 ===');
  lines.push(`总字符数: ${chars.length}`);
  lines.push('');

  lines.push('序号 | 字符 | Unicode  | 十进制  | 十六进制 | 八进制   | 二进制');
  lines.push('----|------|----------|---------|----------|----------|----------');

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const code = ch.codePointAt(0) ?? 0;
    const hex = code.toString(16).toUpperCase().padStart(4, '0');
    const dec = code.toString().padStart(5, ' ');
    const oct = code.toString(8).padStart(6, ' ');
    const bin = code.toString(2).padStart(8, '0');
    const display = ch === ' ' ? '␠' : ch === '\n' ? '␊' : ch === '\t' ? '␉' : ch;
    const uni = code > 0xFFFF ? `U+${code.toString(16).toUpperCase().padStart(5, '0')}` : `U+${hex}`;
    const idx = (i + 1).toString().padStart(3, ' ');
    lines.push(`${idx} | ${display.padEnd(4, ' ')} | ${uni.padEnd(8, ' ')} | ${dec} | ${hex.padEnd(8, ' ')} | ${oct} | ${bin}`);
  }

  lines.push('');
  lines.push('--- 字符统计 ---');

  const freq: Record<string, number> = {};
  for (const ch of chars) {
    freq[ch] = (freq[ch] ?? 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  for (const [ch, count] of sorted) {
    const display = ch === ' ' ? '␠(空格)' : ch === '\n' ? '␊(换行)' : ch;
    lines.push(`${display}: ${count} 次`);
  }

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => analyzeChars(input)}
  />
);

export default ToolComponent;
