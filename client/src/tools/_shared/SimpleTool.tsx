import { Play } from 'lucide-react';
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

interface ModeOption {
  value: string;
  label: string;
}

interface ParamConfig {
  name: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  default?: string;
}

interface SimpleToolProps extends ToolProps {
  execute: (
    input: string,
    mode: string,
    params: Record<string, unknown>,
    file?: File | null,
  ) => string;
  modeOptions?: ModeOption[];
  paramsConfig?: ParamConfig[];
  toolName?: string;
}

const SimpleTool = ({
  input,
  setOutput,
  mode,
  params,
  setParams,
  file,
  execute,
  modeOptions,
  paramsConfig,
  toolName,
}: SimpleToolProps) => {
  const handleExecute = () => {
    if (input.length > MAX_INPUT_CHARS) {
      setOutput(`错误: 输入超过 ${MAX_INPUT_CHARS.toLocaleString()} 字符限制（当前 ${input.length.toLocaleString()} 字符）。请截断后重试。`);
      return;
    }
    try {
      const result = execute(input, mode, params, file);
      setOutput(result);
    } catch (e) {
      setOutput(`错误: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  return (
    <ToolErrorBoundary toolName={toolName}>
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={toolName ? `${toolName} 工具控制` : '工具控制'}>
        {modeOptions && modeOptions.length > 1 && (
          <Select
            value={mode}
            onValueChange={(v: string) => setParams({ mode: v })}
          >
            <SelectTrigger className="w-28 h-8" aria-label="操作模式">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modeOptions.map((opt: ModeOption) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        <Button size="sm" onClick={handleExecute} aria-label="执行工具">
          <Play className="size-3.5" aria-hidden="true" />
          执行
        </Button>
      </div>
    </ToolErrorBoundary>
  );
};

export default SimpleTool;
