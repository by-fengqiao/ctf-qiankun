import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (!trimmed.startsWith('data:')) {
        throw new Error('不是有效的 Data URI（必须以 data: 开头）');
      }
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex === -1) {
        throw new Error('Data URI 格式错误：缺少逗号分隔符');
      }
      const header = trimmed.slice(5, commaIndex);
      const data = trimmed.slice(commaIndex + 1);
      const isBase64 = header.includes(';base64');
      const mimeMatch = header.match(/^([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'text/plain';
      const paramParts = header.split(';').filter((p: string) => p && !p.startsWith('base64') && p !== mimeType);
      let decodedData: string;
      let byteLength: number;
      if (isBase64) {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        decodedData = new TextDecoder('utf-8').decode(bytes);
        byteLength = bytes.length;
      } else {
        decodedData = decodeURIComponent(data);
        byteLength = new TextEncoder().encode(decodedData).length;
      }
      const lines: string[] = [
        '=== Data URI 解析结果 ===',
        '',
        `MIME 类型: ${mimeType}`,
        `编码方式: ${isBase64 ? 'Base64' : 'URL-encoded'}`,
      ];
      if (paramParts.length > 0) {
        lines.push(`参数: ${paramParts.join(', ')}`);
      }
      lines.push(`数据大小: ${byteLength} bytes`);
      lines.push('');
      lines.push('=== 解码后内容 ===');
      const preview = decodedData.length > 200 ? decodedData.slice(0, 200) + '...' : decodedData;
      lines.push(preview);
      if (mimeType.startsWith('image/')) {
        lines.push('\nℹ️ 这是一个图片 Data URI');
      } else if (mimeType.startsWith('text/')) {
        lines.push('\nℹ️ 这是一个文本 Data URI');
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
