import { useState, type ReactNode } from 'react';
import { Copy, Download, FileOutput, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const visualizeControlChars = (str: string): string => {
  return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const hex = code.toString(16).padStart(2, '0').toUpperCase();
    return `\\x${hex}`;
  });
};

interface OutputSegment {
  type: 'text' | 'image';
  content: string;
}

function parseOutputSegments(value: string): OutputSegment[] {
  const lines = value.split('\n');
  const segments: OutputSegment[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      segments.push({ type: 'text', content: textBuffer.join('\n') });
      textBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('data:image/') && !line.startsWith('data:image/svg')) {
      flushText();
      segments.push({ type: 'image', content: line.trim() });
    } else {
      textBuffer.push(line);
    }
  }
  flushText();

  return segments;
}

function renderSegments(segments: OutputSegment[]): ReactNode[] {
  return segments.map((seg, i) => {
    if (seg.type === 'image') {
      return (
        <div key={`img-${i}`} className="px-3 pb-2">
          <img
            src={seg.content}
            alt="处理结果"
            className="max-w-full rounded-lg border border-border"
          />
        </div>
      );
    }
    const text = seg.content.trim();
    if (!text) return null;
    return (
      <pre
        key={`txt-${i}`}
        className="p-3 text-sm font-mono whitespace-pre-wrap break-all text-foreground"
      >
        {visualizeControlChars(text)}
      </pre>
    );
  });
}

interface OutputPanelProps {
  value: string;
  loading?: boolean;
}

const OutputPanel = ({ value, loading }: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownload = () => {
    if (!value) return;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasImage = value.includes('data:image/');

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileOutput className="size-3.5" />
          <span>输出</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value || loading}
            className="h-7 px-2 text-xs"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            复制
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!value || loading}
            className="h-7 px-2 text-xs"
          >
            <Download className="size-3.5" />
            下载
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            处理中...
          </div>
        ) : value ? (
          hasImage ? (
            <div className="py-1">
              {renderSegments(parseOutputSegments(value))}
            </div>
          ) : (
            <pre className="p-3 text-sm font-mono whitespace-pre-wrap break-all text-foreground">
              {visualizeControlChars(value)}
            </pre>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <FileOutput className="size-8 text-muted-foreground/40" />
            <span>执行操作后结果将显示在这里</span>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OutputPanel;
