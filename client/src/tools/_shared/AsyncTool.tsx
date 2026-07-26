import { useState, useRef, useCallback } from 'react';
import { Play, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ToolErrorBoundary from './ToolErrorBoundary';
import type { ToolProps } from '../types';

const MAX_INPUT_CHARS = 500_000;
const EXECUTE_TIMEOUT_MS = 30_000;

interface ParamConfig {
  name: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  default?: string;
}

interface AsyncToolProps extends ToolProps {
  execute: (
    input: string,
    mode: string,
    params: Record<string, unknown>,
    file?: File | null,
  ) => Promise<string>;
  paramsConfig?: ParamConfig[];
  buttonText?: string;
  toolName?: string;
}

const AsyncTool = ({
  input,
  setOutput,
  mode,
  params,
  setParams,
  file,
  execute,
  paramsConfig,
  buttonText = '执行',
  toolName,
}: AsyncToolProps) => {
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    setOutput('已取消执行。');
  }, [setOutput]);

  const handleExecute = async () => {
    if (input.length > MAX_INPUT_CHARS) {
      setOutput(`错误: 输入超过 ${MAX_INPUT_CHARS.toLocaleString()} 字符限制（当前 ${input.length.toLocaleString()} 字符）。请截断后重试。`);
      return;
    }
    cancelledRef.current = false;
    setLoading(true);

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error(`执行超时（${EXECUTE_TIMEOUT_MS / 1000}s）。输入数据可能过大或算法复杂度过高。`));
      }, EXECUTE_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([
        execute(input, mode, params, file),
        timeoutPromise,
      ]);
      if (!cancelledRef.current) setOutput(result);
    } catch (e) {
      if (!cancelledRef.current) {
        setOutput(`错误: ${e instanceof Error ? e.message : '未知错误'}`);
      }
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!cancelledRef.current) setLoading(false);
    }
  };

  return (
    <ToolErrorBoundary toolName={toolName}>
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={toolName ? `${toolName} 工具控制` : '工具控制'}>
        {paramsConfig?.map((cfg: ParamConfig) => (
          <div key={cfg.name} className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor={`param-${cfg.name}`}>
              {cfg.label}
            </Label>
            {cfg.type === 'text' ? (
              <Input
                id={`param-${cfg.name}`}
                className="h-8 w-32"
                placeholder={cfg.placeholder}
                value={(params[cfg.name] as string) ?? cfg.default ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setParams({ [cfg.name]: e.target.value })
                }
                aria-label={cfg.label}
              />
            ) : (
              <Select
                value={(params[cfg.name] as string) ?? cfg.default ?? ''}
                onValueChange={(v: string) => setParams({ [cfg.name]: v })}
              >
                <SelectTrigger className="w-32 h-8" aria-label={cfg.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cfg.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
        <Button size="sm" onClick={handleExecute} disabled={loading} aria-label={buttonText}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
          {loading ? '处理中...' : buttonText}
        </Button>
        {loading && (
          <Button size="sm" variant="ghost" onClick={handleCancel} aria-label="取消执行">
            <X className="size-3.5" aria-hidden="true" />
            取消
          </Button>
        )}
      </div>
    </ToolErrorBoundary>
  );
};

export default AsyncTool;
