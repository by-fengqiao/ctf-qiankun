import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '格式化' },
      { value: 'decode', label: '压缩' },
    ]}
    execute={(input: string, mode: string) => {
      const xml = input.trim();
      if (mode === 'decode') {
        return xml.replace(/>\s+</gu, '><').replace(/\s{2,}/gu, '').trim();
      }
      let formatted = '';
      let indent = 0;
      const tokens = xml.replace(/(>)(<)(\/*)/gu, '$1\n$2$3').split('\n');
      for (const token of tokens) {
        const trimmed = token.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        } else if (trimmed.startsWith('<') && !trimmed.startsWith('<!') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
          formatted += '  '.repeat(indent) + trimmed + '\n';
          indent++;
          continue;
        }
        formatted += '  '.repeat(indent) + trimmed + '\n';
      }
      return formatted.trimEnd();
    }}
  />
);

export default ToolComponent;
