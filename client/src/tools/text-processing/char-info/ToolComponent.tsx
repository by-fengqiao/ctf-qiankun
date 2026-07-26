import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const seen = new Set<string>();
      const lines: string[] = ['字符\t码点\t\t十进制\t十六进制\t八进制\t\t二进制'];
      for (const char of input) {
        if (seen.has(char)) continue;
        seen.add(char);
        const code: number | undefined = char.codePointAt(0);
        if (code === undefined) continue;
        const hex: string = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
        const dec: string = code.toString();
        const hexStr: string = '0x' + code.toString(16).toUpperCase();
        const octStr: string = '0' + code.toString(8);
        const binStr: string = code.toString(2).padStart(8, '0');
        lines.push(`${char}\t${hex}\t${dec}\t${hexStr}\t${octStr}\t${binStr}`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
