import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'pattern',
        label: 'Hex模式',
        type: 'text',
        default: '',
        placeholder: '如 48656c6c6f',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const pattern = ((params.pattern as string) ?? '').replace(/\s/g, '').toLowerCase();
      if (!pattern) throw new Error('请输入要搜索的 Hex 模式');
      if (pattern.length % 2 !== 0) throw new Error('Hex 模式长度必须为偶数');
      const bytes = getInputBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const hexStr = Array.from(bytes)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      const matches: number[] = [];
      let idx = hexStr.indexOf(pattern);
      while (idx !== -1 && matches.length < 1000) {
        if (idx % 2 === 0) {
          matches.push(idx / 2);
        }
        idx = hexStr.indexOf(pattern, idx + 2);
      }
      if (matches.length === 0) return `未找到模式: ${pattern}`;
      return [
        `=== 找到 ${matches.length} 处匹配 ===`,
        `模式: ${pattern}`,
        ...matches.slice(0, 100).map((pos: number) => `偏移 0x${pos.toString(16).padStart(8, '0')} (${pos})`),
        matches.length > 100 ? `...(仅显示前 100 处)` : '',
      ].filter(Boolean).join('\n');
    }}
  />
);
export default ToolComponent;
