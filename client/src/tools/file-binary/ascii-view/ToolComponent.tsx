import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input.trim()) return '请输入要查看 ASCII 视图的内容';
      const bytes = getInputBytes(input);
      const maxBytes = Math.min(bytes.length, 8192);
      const lines: string[] = ['=== ASCII View ==='];
      const bpl = 64;
      for (let offset = 0; offset < maxBytes; offset += bpl) {
        const slice = bytes.slice(offset, Math.min(offset + bpl, maxBytes));
        const asciiPart = Array.from(slice)
          .map((b: number) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·')
          .join('');
        lines.push(asciiPart);
      }
      const printable = Array.from(bytes.slice(0, maxBytes))
        .filter((b: number) => b >= 32 && b <= 126).length;
      lines.push(`\n可打印字符: ${printable}/${maxBytes}`);
      if (bytes.length > maxBytes) {
        lines.push(`(共 ${bytes.length} 字节，仅显示前 ${maxBytes} 字节)`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
