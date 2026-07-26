import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isBinaryFile, readFileAsHex } from '@/tools/_shared/inputUtils';

interface FileDropZoneProps {
  onFileLoad: (content: string, fileName: string) => void;
  onFileSelect?: (file: File) => void;
  maxBytes?: number;
}

const DEFAULT_MAX = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FileDropZone = ({ onFileLoad, onFileSelect, maxBytes = DEFAULT_MAX }: FileDropZoneProps) => {
  const onDrop = useCallback(
    async (accepted: File[], rejections: { file: File; errors: { code: string; message: string }[] }[]) => {
      if (rejections.length > 0) {
        const errs = rejections[0].errors;
        if (errs.some((e) => e.code === 'file-too-large')) {
          toast.error(`文件大小超过限制（最大 ${formatSize(maxBytes)}）`);
        } else {
          toast.error('文件无法加载');
        }
        return;
      }
      const file = accepted[0];
      if (!file) return;
      onFileSelect?.(file);

      const binary = isBinaryFile(file);
      try {
        if (binary) {
          const hex = await readFileAsHex(file);
          onFileLoad(hex, file.name);
          toast.success(`已加载 (hex): ${file.name} (${formatSize(file.size)})`);
        } else {
          const text = await file.text();
          onFileLoad(text, file.name);
          toast.success(`已加载: ${file.name} (${formatSize(file.size)})`);
        }
      } catch {
        toast.error('文件读取失败');
      }
    },
    [maxBytes, onFileLoad, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxBytes,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-accent/50'
          : 'border-border hover:bg-accent/30'
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="size-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground truncate">
        {isDragActive ? '释放以加载文件' : '拖拽文件到此处或点击选择'}
      </span>
    </div>
  );
};

export default FileDropZone;
