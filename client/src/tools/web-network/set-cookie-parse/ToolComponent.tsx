import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface ParsedSetCookie {
  name: string;
  value: string;
  attributes: Record<string, string>;
  flags: string[];
}

const parseSetCookie = (input: string): ParsedSetCookie => {
  const parts = input.split(';').map((s) => s.trim());
  if (parts.length === 0 || !parts[0]) {
    throw new Error('无效的 Set-Cookie 头');
  }
  const firstPair = parts[0];
  const eqIdx = firstPair.indexOf('=');
  if (eqIdx === -1) {
    throw new Error('Cookie 名值对缺少 = 分隔符');
  }
  const name = firstPair.slice(0, eqIdx).trim();
  const value = firstPair.slice(eqIdx + 1).trim();
  const attributes: Record<string, string> = {};
  const flags: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const attrEq = part.indexOf('=');
    if (attrEq === -1) {
      flags.push(part);
    } else {
      const attrName = part.slice(0, attrEq).trim();
      const attrValue = part.slice(attrEq + 1).trim();
      attributes[attrName] = attrValue;
    }
  }
  return { name, value, attributes, flags };
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parsed = parseSetCookie(input);
      const lines: string[] = [];
      lines.push(`名称: ${parsed.name}`);
      lines.push(`值: ${parsed.value}`);
      lines.push(`值长度: ${parsed.value.length}`);
      if (Object.keys(parsed.attributes).length > 0) {
        lines.push('');
        lines.push('属性:');
        for (const [k, v] of Object.entries(parsed.attributes)) {
          lines.push(`  ${k}: ${v}`);
        }
      }
      if (parsed.flags.length > 0) {
        lines.push('');
        lines.push('标志位:');
        for (const f of parsed.flags) {
          lines.push(`  ${f}`);
        }
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
