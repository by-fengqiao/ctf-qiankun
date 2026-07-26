import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'delimiter',
        label: '分隔符',
        type: 'select',
        options: [
          { value: ',', label: '逗号' },
          { value: ';', label: '分号' },
          { value: '\t', label: 'Tab' },
          { value: '|', label: '竖线' },
        ],
        default: ',',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const delimiter = (params.delimiter as string) ?? ',';
      const lines = input.trim().split('\n').filter((l: string) => l.trim());
      if (lines.length < 2) throw new Error('CSV 需要至少标题行和一行数据');
      const parseLine = (line: string): string[] => {
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === delimiter && !inQuotes) {
            fields.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
        fields.push(current);
        return fields;
      };
      const headers = parseLine(lines[0]);
      const rows = lines.slice(1).map((line: string) => {
        const values = parseLine(line);
        const row: Record<string, string> = {};
        for (let i = 0; i < headers.length; i++) {
          row[headers[i]] = values[i] ?? '';
        }
        return row;
      });
      return JSON.stringify(rows, null, 2);
    }}
  />
);

export default ToolComponent;
