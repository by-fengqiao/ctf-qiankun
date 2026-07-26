import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(_input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (!file) throw new Error('请先拖入一个文件');
      const size = file.size;
      return [
        '=== 文件大小 ===',
        `字节:   ${size} B`,
        `KB:     ${(size / 1024).toFixed(2)}`,
        `MB:     ${(size / 1024 / 1024).toFixed(4)}`,
        `可读:   ${formatSize(size)}`,
        `位:     ${size * 8} bit`,
        `KB取整: ${Math.ceil(size / 1024)} KB`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
