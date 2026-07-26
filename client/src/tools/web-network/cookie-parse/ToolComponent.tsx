import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const parseCookie = (input: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const pairs = input.split(';').map((s) => s.trim()).filter(Boolean);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      result[pair] = '';
    } else {
      const key = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      result[key] = value;
    }
  }
  return result;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parsed = parseCookie(input);
      const entries = Object.entries(parsed);
      const lines = entries.map(
        ([k, v]) => `${k}:\n  value: ${v}\n  length: ${v.length}`,
      );
      return `共解析 ${entries.length} 个 Cookie:\n\n${lines.join('\n\n')}`;
    }}
  />
);

export default ToolComponent;
