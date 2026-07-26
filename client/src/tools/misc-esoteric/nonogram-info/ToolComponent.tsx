import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface ClueSet {
  rowClues: number[][];
  colClues: number[][];
}

function parseClues(input: string): ClueSet {
  const lines = input.split('\n');
  const rowClues: number[][] = [];
  const colClues: number[][] = [];
  let section: 'rows' | 'cols' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('rows') || trimmed.toLowerCase().startsWith('row')) {
      section = 'rows';
      continue;
    }
    if (trimmed.toLowerCase().startsWith('cols') || trimmed.toLowerCase().startsWith('col')) {
      section = 'cols';
      continue;
    }
    if (trimmed.length === 0) {
      section = null;
      continue;
    }
    const nums = trimmed.split(/[\s,]+/).map((n: string) => parseInt(n, 10)).filter((n: number) => !isNaN(n) && n >= 0);
    if (nums.length === 0) continue;
    if (section === 'rows') rowClues.push(nums);
    else if (section === 'cols') colClues.push(nums);
    else {
      if (rowClues.length === 0) {
        rowClues.push(nums);
      } else {
        colClues.push(nums);
      }
    }
  }

  if (rowClues.length === 0 && colClues.length === 0) {
    const nums = input.trim().split(/[\s,]+/).map((n: string) => parseInt(n, 10)).filter((n: number) => !isNaN(n) && n >= 0);
    if (nums.length > 0) rowClues.push(nums);
  }

  return { rowClues, colClues };
}

function analyzeNonogram(input: string): string {
  const { rowClues, colClues } = parseClues(input);
  const lines: string[] = [];

  lines.push('=== Nonogram 线索解析 ===');
  lines.push('');

  lines.push(`行数: ${rowClues.length}`);
  lines.push(`列数: ${colClues.length}`);
  lines.push('');

  const maxRowSum = rowClues.reduce((max, clues) => {
    const sum = clues.reduce((a, b) => a + b, 0) + clues.length - 1;
    return Math.max(max, sum);
  }, 0);
  const maxColSum = colClues.reduce((max, clues) => {
    const sum = clues.reduce((a, b) => a + b, 0) + clues.length - 1;
    return Math.max(max, sum);
  }, 0);

  lines.push(`行线索最大占用: ${maxRowSum}`);
  lines.push(`列线索最大占用: ${maxColSum}`);
  lines.push('');

  lines.push('--- 行线索 ---');
  rowClues.forEach((clues: number[], i: number) => {
    const sum = clues.reduce((a, b) => a + b, 0);
    const minLen = sum + clues.length - 1;
    lines.push(`第${i + 1}行: ${clues.join(' ')} (填充${sum}格, 最小占用${minLen}格)`);
  });

  lines.push('');
  lines.push('--- 列线索 ---');
  colClues.forEach((clues: number[], i: number) => {
    const sum = clues.reduce((a, b) => a + b, 0);
    const minLen = sum + clues.length - 1;
    lines.push(`第${i + 1}列: ${clues.join(' ')} (填充${sum}格, 最小占用${minLen}格)`);
  });

  if (rowClues.length > 0 && colClues.length > 0) {
    lines.push('');
    lines.push('--- 网格预览 ---');
    const rows = rowClues.length;
    const cols = colClues.length;
    lines.push(`预期网格: ${rows} × ${cols}`);
    lines.push(`总格子数: ${rows * cols}`);
  }

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => analyzeNonogram(input)}
  />
);

export default ToolComponent;
