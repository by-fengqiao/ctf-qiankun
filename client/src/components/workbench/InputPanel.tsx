import { Type } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface InputPanelProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const InputPanel = ({ value, onChange, placeholder }: InputPanelProps) => {
  const charCount = value.length;
  const lineCount = value ? value.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Type className="size-3.5" />
          <span>输入</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {charCount} 字符 · {lineCount} 行
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder ?? '在此输入文本...'}
        className="flex-1 min-h-0 resize-none border-0 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:border-transparent"
      />
    </div>
  );
};

export default InputPanel;
