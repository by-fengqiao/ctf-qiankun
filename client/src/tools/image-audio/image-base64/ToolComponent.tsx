import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsDataURL } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file) {
        const dataUrl = await readFileAsDataURL(file);
        return [
          `图片转 Base64`,
          `文件名: ${file.name}`,
          `MIME: ${file.type}`,
          `原始大小: ${file.size} 字节`,
          `Base64 大小: ${dataUrl.length} 字符`,
          '',
          dataUrl,
        ].join('\n');
      }
      if (!input) return '请拖入图片文件或输入文本进行 Base64 编码';
      try {
        return btoa(unescape(encodeURIComponent(input)));
      } catch {
        return '编码失败: 输入包含无法处理的字符';
      }
    }}
  />
);

export default ToolComponent;
