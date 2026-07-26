import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const escapeCell = (val: unknown): string => {
  const str: string = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const data: unknown = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('输入必须是 JSON 数组');
      const rows: Record<string, unknown>[] = data as Record<string, unknown>[];
      if (rows.length === 0) return '(空数组)';
      const headers: string[] = Object.keys(rows[0]);
      const headerLine: string = headers.map(escapeCell).join(',');
      const dataLines: string[] = rows.map(
        (row: Record<string, unknown>) =>
          headers
            .map((h: string) => escapeCell(row[h]))
            .join(','),
      );
      return [headerLine, ...dataLines].join('\n');
    }}
  />
);

export default ToolComponent;
