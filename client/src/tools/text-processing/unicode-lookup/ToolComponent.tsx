import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines: string[] = ['字符\t码点\t\tUTF-8\t\t\tUTF-16'];
      for (const char of input) {
        const code: number | undefined = char.codePointAt(0);
        if (code === undefined) continue;
        const hex: string = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
        const utf8Bytes: Uint8Array = new TextEncoder().encode(char);
        const utf8Hex: string = Array.from(utf8Bytes)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join(' ');
        let utf16Hex: string;
        if (code <= 0xffff) {
          utf16Hex = code.toString(16).toUpperCase().padStart(4, '0');
        } else {
          const high: number = 0xd800 | ((code - 0x10000) >> 10);
          const low: number = 0xdc00 | ((code - 0x10000) & 0x3ff);
          utf16Hex = `${high.toString(16).toUpperCase()} ${low.toString(16).toUpperCase()}`;
        }
        lines.push(`${char}\t${hex}\t${utf8Hex}\t\t${utf16Hex}`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
