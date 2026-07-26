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
      const html = input.trim();
      if (mode === 'decode') {
        return html.replace(/>\s+</gu, '><').replace(/\s{2,}/gu, ' ').trim();
      }
      const voidElements = new Set([
        'area','base','br','col','embed','hr','img','input',
        'link','meta','param','source','track','wbr','!doctype',
      ]);
      let formatted = '';
      let indent = 0;
      let pos = 0;
      while (pos < html.length) {
        const ltIdx = html.indexOf('<', pos);
        if (ltIdx === -1) {
          const text = html.slice(pos).trim();
          if (text) formatted += '  '.repeat(indent) + text + '\n';
          break;
        }
        if (ltIdx > pos) {
          const text = html.slice(pos, ltIdx).trim();
          if (text) formatted += '  '.repeat(indent) + text + '\n';
        }
        const gtIdx = html.indexOf('>', ltIdx);
        if (gtIdx === -1) break;
        const tag = html.slice(ltIdx, gtIdx + 1);
        const tagName = tag.match(/^<\/?\s*([a-zA-Z0-9!]+)/u)?.[1]?.toLowerCase() ?? '';
        if (tag.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          formatted += '  '.repeat(indent) + tag + '\n';
        } else if (voidElements.has(tagName) || tag.endsWith('/>')) {
          formatted += '  '.repeat(indent) + tag + '\n';
        } else {
          formatted += '  '.repeat(indent) + tag + '\n';
          indent++;
        }
        pos = gtIdx + 1;
      }
      return formatted.trimEnd();
    }}
  />
);

export default ToolComponent;
