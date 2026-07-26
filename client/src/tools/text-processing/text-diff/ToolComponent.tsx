import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'otherText', label: '对比文本', type: 'text', placeholder: '输入要对比的文本...' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const otherText = (params.otherText as string) ?? '';
      const linesA = input.split('\n');
      const linesB = otherText.split('\n');
      const result: string[] = [];

      if (linesA.length > 1000 || linesB.length > 1000) {
        const maxLen = Math.max(linesA.length, linesB.length);
        for (let i = 0; i < maxLen; i++) {
          const a = linesA[i];
          const b = linesB[i];
          if (a !== undefined && b !== undefined && a === b) {
            result.push(`  ${a}`);
          } else {
            if (a !== undefined) result.push(`- ${a}`);
            if (b !== undefined) result.push(`+ ${b}`);
          }
        }
      } else {
        const n = linesA.length;
        const m = linesB.length;
        const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
          for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = linesA[i] === linesB[j]
              ? dp[i + 1][j + 1] + 1
              : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
        let i = 0;
        let j = 0;
        while (i < n && j < m) {
          if (linesA[i] === linesB[j]) {
            result.push(`  ${linesA[i]}`);
            i++;
            j++;
          } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            result.push(`- ${linesA[i]}`);
            i++;
          } else {
            result.push(`+ ${linesB[j]}`);
            j++;
          }
        }
        while (i < n) { result.push(`- ${linesA[i++]}`); }
        while (j < m) { result.push(`+ ${linesB[j++]}`); }
      }

      const added = result.filter((r: string) => r.startsWith('+')).length;
      const removed = result.filter((r: string) => r.startsWith('-')).length;
      const same = result.filter((r: string) => r.startsWith('  ')).length;
      return [
        ...result,
        `\n--- 统计 ---`,
        `相同行: ${same}`,
        `新增行: ${added}`,
        `删除行: ${removed}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
