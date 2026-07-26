import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function validateSet(cells: number[]): { valid: boolean; missing: number[] } {
  const seen = new Set<number>();
  const missing: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (!cells.includes(n)) missing.push(n);
  }
  const nonZero = cells.filter((c: number) => c !== 0);
  for (const c of nonZero) {
    if (seen.has(c)) return { valid: false, missing };
    seen.add(c);
  }
  return { valid: true, missing };
}

function validateSudoku(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  const lines: string[] = [];

  lines.push('=== 数独验证 ===');
  lines.push('');

  if (digits.length !== 81) {
    lines.push(`错误：需要 81 个数字，当前 ${digits.length} 个`);
    lines.push('（0 表示空格）');
    return lines.join('\n');
  }

  const grid: number[][] = [];
  for (let r = 0; r < 9; r++) {
    grid.push([]);
    for (let c = 0; c < 9; c++) {
      grid[r].push(parseInt(digits[r * 9 + c], 10));
    }
  }

  lines.push('--- 数独网格 ---');
  for (let r = 0; r < 9; r++) {
    let rowStr = '';
    for (let c = 0; c < 9; c++) {
      rowStr += grid[r][c] === 0 ? '·' : String(grid[r][c]);
      if (c === 2 || c === 5) rowStr += ' ';
    }
    lines.push(rowStr);
    if (r === 2 || r === 5) lines.push('');
  }
  lines.push('');

  let allValid = true;
  let filledCount = 0;

  for (let r = 0; r < 9; r++) {
    const cells = grid[r];
    filledCount += cells.filter((c: number) => c !== 0).length;
    const { valid, missing } = validateSet(cells);
    if (!valid) {
      allValid = false;
      lines.push(`第${r + 1}行: ❌ 有重复数字`);
    } else if (missing.length > 0) {
      lines.push(`第${r + 1}行: ⚠ 缺少 ${missing.join(', ')}`);
    } else {
      lines.push(`第${r + 1}行: ✓ 完整`);
    }
  }

  lines.push('');
  for (let c = 0; c < 9; c++) {
    const cells = grid.map((row: number[]) => row[c]);
    const { valid, missing } = validateSet(cells);
    if (!valid) {
      allValid = false;
      lines.push(`第${c + 1}列: ❌ 有重复数字`);
    } else if (missing.length > 0) {
      lines.push(`第${c + 1}列: ⚠ 缺少 ${missing.join(', ')}`);
    } else {
      lines.push(`第${c + 1}列: ✓ 完整`);
    }
  }

  lines.push('');
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: number[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          cells.push(grid[br * 3 + r][bc * 3 + c]);
        }
      }
      const boxNum = br * 3 + bc + 1;
      const { valid, missing } = validateSet(cells);
      if (!valid) {
        allValid = false;
        lines.push(`宫${boxNum}: ❌ 有重复数字`);
      } else if (missing.length > 0) {
        lines.push(`宫${boxNum}: ⚠ 缺少 ${missing.join(', ')}`);
      } else {
        lines.push(`宫${boxNum}: ✓ 完整`);
      }
    }
  }

  lines.push('');
  lines.push(`已填格数: ${filledCount} / 81`);
  lines.push(`填充率: ${((filledCount / 81) * 100).toFixed(1)}%`);

  if (filledCount === 81 && allValid) {
    lines.push('');
    lines.push('🎉 验证结果：数独解答正确！');
  } else if (allValid) {
    lines.push('');
    lines.push('✅ 验证结果：当前填写无冲突（部分完成）');
  } else {
    lines.push('');
    lines.push('❌ 验证结果：数独存在冲突，请检查');
  }

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => validateSudoku(input)}
  />
);

export default ToolComponent;
