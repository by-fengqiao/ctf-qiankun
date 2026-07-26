import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed: string = input.trim();
      if (trimmed.length === 0) return '输入为空';
      const base64Regex: RegExp = /^[A-Za-z0-9+/]+={0,2}$/u;
      const hasValidChars: boolean = base64Regex.test(trimmed);
      const hasValidLength: boolean = trimmed.length % 4 === 0;
      const isValid: boolean = hasValidChars && hasValidLength;
      let decoded = '';
      let isPrintable = false;
      if (isValid) {
        try {
          decoded = atob(trimmed);
          isPrintable = /^[\x20-\x7E]*$/u.test(decoded);
        } catch {
          decoded = '';
        }
      }
      const lines: string[] = [
        `是否为有效 Base64: ${isValid ? '是' : '否'}`,
        `长度: ${trimmed.length}`,
        `长度是否为4的倍数: ${hasValidLength ? '是' : '否'}`,
        `字符集是否合法: ${hasValidChars ? '是' : '否'}`,
      ];
      if (decoded) {
        const preview: string = decoded.substring(0, 200);
        lines.push(`解码预览: ${preview}`);
        lines.push(`解码内容为可打印 ASCII: ${isPrintable ? '是' : '否'}`);
        if (decoded.length > 200) {
          lines.push(`(解码总长度: ${decoded.length} 字符)`);
        }
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
