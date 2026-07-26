import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const keywords = new Set([
        'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET',
        'DELETE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','AND','OR',
        'NOT','NULL','IS','IN','LIKE','BETWEEN','ORDER','BY','GROUP',
        'HAVING','LIMIT','OFFSET','UNION','ALL','DISTINCT','AS','CASE',
        'WHEN','THEN','ELSE','END','CREATE','TABLE','INDEX','VIEW','DROP',
        'ALTER','ADD','PRIMARY','KEY','FOREIGN','REFERENCES','CONSTRAINT',
        'DEFAULT','UNIQUE','CHECK','ASC','DESC','COUNT','SUM','AVG','MIN',
        'MAX','EXISTS','EXPLAIN','BEGIN','COMMIT','ROLLBACK','TRANSACTION',
      ]);
      const protectedRe = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|--[^\n]*|\/\*[\s\S]*?\*\//gu;
      const protectedParts: string[] = [];
      let sql = input.replace(protectedRe, (m: string) => {
        protectedParts.push(m);
        return `\u0000${protectedParts.length - 1}\u0000`;
      });
      sql = sql.replace(/\s+/gu, ' ').trim();
      for (const kw of keywords) {
        const re = new RegExp(`\\b${kw}\\b`, 'giu');
        sql = sql.replace(re, kw);
      }
      sql = sql.replace(/\b(SELECT|FROM|WHERE|VALUES|SET|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|VALUES|INTO)\b/gu, '\n$1');
      sql = sql.replace(/\b(LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|JOIN|UNION ALL|UNION|AND|OR|ON)\b/gu, '\n  $1');
      sql = sql.replace(/\b(VALUES)\s*\(/gu, '$1 (');
      const lines = sql.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const formatted: string[] = [];
      for (const line of lines) {
        if (/^(AND|OR|ON|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|JOIN)\b/u.test(line)) {
          formatted.push('  ' + line);
        } else {
          formatted.push(line);
        }
      }
      const joined = formatted.join('\n');
      return joined.replace(/\u0000(\d+)\u0000/gu, (_m: string, idx: string) => protectedParts[Number(idx)] ?? '');
    }}
  />
);

export default ToolComponent;
