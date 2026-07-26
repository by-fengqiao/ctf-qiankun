import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          const result: string[] = [];
          for (const ch of Array.from(input)) {
            const code = ch.charCodeAt(0);
            const lo = code & 0xff;
            const hi = (code >> 8) & 0xff;
            result.push(lo.toString(16).padStart(2, '0'), hi.toString(16).padStart(2, '0'));
          }
          return result.join(' ');
        }
        const clean = input.replace(/[\s-]/g, '');
        if (!clean) return '';
        const hexArr = clean.match(/.{1,4}/g);
        if (!hexArr) return '错误: 无效的十六进制输入';
        let result = '';
        for (const group of hexArr) {
          const padded = group.padEnd(4, '0');
          const lo = parseInt(padded.slice(0, 2), 16);
          const hi = parseInt(group.slice(2, 4), 16);
          result += String.fromCharCode((hi << 8) | lo);
        }
        return result;
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
