import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'analyze', label: '匹配' },
      { value: 'generate', label: '替换' },
    ]}
    paramsConfig={[
      { name: 'pattern', label: '正则', type: 'text', placeholder: '\\d+', default: '' },
      { name: 'flags', label: '标志', type: 'text', placeholder: 'g', default: 'g' },
      { name: 'replacement', label: '替换', type: 'text', placeholder: '替换为...', default: '' },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const pattern = (params.pattern as string) ?? '';
      const flags = (params.flags as string) ?? 'g';
      if (!pattern) throw new Error('请输入正则表达式');
      const regex = new RegExp(pattern, flags);
      if (mode === 'generate') {
        const replacement = (params.replacement as string) ?? '';
        return input.replace(regex, replacement);
      }
      const matches = [...input.matchAll(regex)];
      if (matches.length === 0) return '未找到匹配';
      const lines: string[] = [`找到 ${matches.length} 个匹配:\n`];
      for (const m of matches) {
        const groups = m.length > 1 ? ` → 分组: [${m.slice(1).join(', ')}]` : '';
        const idx = `位置 ${m.index ?? 0}: `;
        lines.push(`${idx}"${m[0]}"${groups}`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
