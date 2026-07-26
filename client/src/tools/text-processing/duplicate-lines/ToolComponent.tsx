import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines: string[] = input.split('\n');
      const count = new Map<string, number>();
      for (const line of lines) {
        count.set(line, (count.get(line) ?? 0) + 1);
      }
      const duplicates: Array<[string, number]> = [...count.entries()].filter(
        (entry: [string, number]) => entry[1] > 1,
      );
      if (duplicates.length === 0) return '未找到重复行';
      const totalDupes: number = duplicates.reduce(
        (sum: number, entry: [string, number]) => sum + entry[1] - 1,
        0,
      );
      const lines2: string[] = [
        `重复行\t出现次数`,
        ...duplicates.map(
          (entry: [string, number]) => `${entry[0]}\t${entry[1]}`,
        ),
        ``,
        `重复行种类: ${duplicates.length}`,
        `重复行总数(含原始): ${totalDupes + duplicates.length}`,
        `多余重复行数: ${totalDupes}`,
      ];
      return lines2.join('\n');
    }}
  />
);

export default ToolComponent;
