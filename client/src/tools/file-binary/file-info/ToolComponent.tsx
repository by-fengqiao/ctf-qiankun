import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(_input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (!file) throw new Error('请先拖入一个文件');
      const modified = file.lastModified
        ? new Date(file.lastModified).toLocaleString('zh-CN')
        : '未知';
      return [
        '=== 文件信息 ===',
        `文件名:     ${file.name}`,
        `大小:       ${file.size} B (${formatSize(file.size)})`,
        `MIME 类型:  ${file.type || '(未指定)'}`,
        `最后修改:   ${modified}`,
        `扩展名:     ${file.name.includes('.') ? '.' + file.name.split('.').pop() : '(无)'}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
