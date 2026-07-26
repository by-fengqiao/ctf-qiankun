import type { ReactNode } from 'react';
import type { ToolDefinition } from '@/tools/types';
import { getToolDefinition } from '@/tools/registry';

export type GroupedTools = Map<string, Map<string, ToolDefinition[]>>;

export function groupToolsByCategory(tools: ToolDefinition[]): GroupedTools {
  const byCat: GroupedTools = new Map();
  for (const tool of tools) {
    if (!byCat.has(tool.category)) byCat.set(tool.category, new Map());
    const byGroup = byCat.get(tool.category)!;
    const g = tool.group ?? '其他';
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(tool);
  }
  return byCat;
}

export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const ql = query.toLowerCase();
  if (!lower.includes(ql)) return <>{text}</>;
  const parts: ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(ql, start);
  let key = 0;
  while (idx !== -1) {
    parts.push(text.slice(start, idx));
    parts.push(
      <mark key={key++} className="bg-primary/20 text-primary rounded px-0.5">
        {text.slice(idx, idx + ql.length)}
      </mark>
    );
    start = idx + ql.length;
    idx = lower.indexOf(ql, start);
  }
  parts.push(text.slice(start));
  return <>{parts}</>;
}

export function filterDefs(ids: string[]): ToolDefinition[] {
  return ids
    .map((id) => getToolDefinition(id))
    .filter((t): t is ToolDefinition => t !== undefined);
}
