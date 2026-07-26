import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface TagInfo {
  tag: string;
  attributes: Record<string, string>;
}

const parseTags = (html: string): TagInfo[] => {
  const tagRegex = /<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
  const tags: TagInfo[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const attrStr = match[2] || '';
    const attributes: Record<string, string> = {};
    const attrRegex = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let am: RegExpExecArray | null;
    while ((am = attrRegex.exec(attrStr)) !== null) {
      const name = am[1];
      const value = am[2] ?? am[3] ?? am[4] ?? '';
      attributes[name] = value;
    }
    tags.push({ tag, attributes });
  }
  return tags;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const tags = parseTags(input);
      if (tags.length === 0) {
        return '未找到 HTML 标签';
      }
      const tagCount: Record<string, number> = {};
      for (const t of tags) {
        tagCount[t.tag] = (tagCount[t.tag] ?? 0) + 1;
      }
      const summary = Object.entries(tagCount)
        .map(([tag, count]) => `  <${tag}>: ${count}`)
        .join('\n');
      const details = tags.map((t: TagInfo, i: number) => {
        const attrs = Object.entries(t.attributes)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        return `[${i + 1}] <${t.tag}${attrs ? ' ' + attrs : ''}>`;
      });
      return `共找到 ${tags.length} 个标签:\n\n标签统计:\n${summary}\n\n标签列表:\n${details.join('\n')}`;
    }}
  />
);

export default ToolComponent;
