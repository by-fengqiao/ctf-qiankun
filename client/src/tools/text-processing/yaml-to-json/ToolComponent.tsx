import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface YamlNode {
  key: string;
  value: unknown;
}

const parseYaml = (yaml: string): unknown => {
  const lines = yaml.split('\n').filter((l: string) => l.trim() && !l.trim().startsWith('#'));
  const parseBlock = (lines: string[], startIdx: number, baseIndent: number): [unknown, number] => {
    if (startIdx >= lines.length) return [null, startIdx];
    const firstLine = lines[startIdx];
    const firstIndent = firstLine.length - firstLine.trimStart().length;
    if (firstIndent < baseIndent) return [null, startIdx];
    const trimmed = firstLine.trim();
    if (trimmed.startsWith('- ')) {
      const arr: unknown[] = [];
      let i = startIdx;
      const itemIndent = firstIndent;
      while (i < lines.length) {
        const line = lines[i];
        const indent = line.length - line.trimStart().length;
        if (indent < itemIndent) break;
        if (indent !== itemIndent) { i++; continue; }
        const content = line.trim().slice(2);
        if (content.includes(':')) {
          const subLines = [line.replace(/^\s*-\s*/u, ' '.repeat(itemIndent + 2) + content)];
          let j = i + 1;
          while (j < lines.length) {
            const nextIndent = lines[j].length - lines[j].trimStart().length;
            if (nextIndent <= itemIndent) break;
            subLines.push(lines[j]);
            j++;
          }
          const [obj] = parseBlock(subLines, 0, itemIndent + 2);
          arr.push(obj);
          i = j;
        } else {
          arr.push(parseScalar(content));
          i++;
        }
      }
      return [arr, i];
    }
    const obj: Record<string, unknown> = {};
    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      const indent = line.length - line.trimStart().length;
      if (indent < baseIndent || indent > baseIndent + 2) break;
      if (indent !== baseIndent && Object.keys(obj).length > 0) break;
      const content = line.trim();
      const colonIdx = content.indexOf(':');
      if (colonIdx === -1) break;
      const key = content.slice(0, colonIdx).trim();
      const valStr = content.slice(colonIdx + 1).trim();
      if (valStr === '') {
        let j = i + 1;
        const subLines: string[] = [];
        while (j < lines.length) {
          const nextIndent = lines[j].length - lines[j].trimStart().length;
          if (nextIndent <= baseIndent || !lines[j].trim()) break;
          subLines.push(lines[j]);
          j++;
        }
        if (subLines.length > 0) {
          const [val] = parseBlock(subLines, 0, baseIndent + 2);
          obj[key] = val;
        } else {
          obj[key] = null;
        }
        i = j;
      } else {
        obj[key] = parseScalar(valStr);
        i++;
      }
    }
    return [obj, i];
  };
  const parseScalar = (val: string): unknown => {
    if (val === 'null' || val === '~') return null;
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (/^-?\d+$/u.test(val)) return parseInt(val, 10);
    if (/^-?\d+\.\d+$/u.test(val)) return parseFloat(val);
    if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
    return val;
  };
  const [result] = parseBlock(lines, 0, 0);
  return result;
};

function jsonToYaml(data: unknown, indent = 0): string {
  const pad = ' '.repeat(indent);
  if (data === null || data === undefined) return 'null';
  if (typeof data === 'string') {
    if (data === '' || /[:#\-?]/u.test(data) || /^\s|\s$/u.test(data) || /^\d/u.test(data)) {
      return `"${data.replace(/"/g, '\\"')}"`;
    }
    return data;
  }
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const sub = jsonToYaml(item, indent + 2);
        const lines = sub.split('\n');
        return `${pad}- ${lines[0]}${lines.length > 1 ? '\n' + lines.slice(1).join('\n') : ''}`;
      }
      return `${pad}- ${jsonToYaml(item, 0)}`;
    }).join('\n');
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([key, val]: [string, unknown]) => {
      if (val === null) return `${pad}${key}: null`;
      if (typeof val === 'object' && val !== null) {
        return `${pad}${key}:\n${jsonToYaml(val, indent + 2)}`;
      }
      return `${pad}${key}: ${jsonToYaml(val, 0)}`;
    }).join('\n');
  }
  return String(data);
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') {
        try {
          const data = JSON.parse(input);
          return jsonToYaml(data);
        } catch {
          return '无效的 JSON 格式';
        }
      }
      const result = parseYaml(input);
      return JSON.stringify(result, null, 2);
    }}
    modeOptions={[
      { value: 'encode', label: 'YAML→JSON' },
      { value: 'decode', label: 'JSON→YAML' },
    ]}
  />
);

export default ToolComponent;
