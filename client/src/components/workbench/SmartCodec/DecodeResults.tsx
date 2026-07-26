import { ChevronDown, ChevronRight, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { DecodeCandidate } from '@/lib/codecs';

interface DecodeResultsProps {
  candidates: DecodeCandidate[];
  isDecoding: boolean;
  usedBruteForce: boolean;
  onUseResult: (result: string) => void;
}

const DecodeResults = ({ candidates, isDecoding, usedBruteForce, onUseResult }: DecodeResultsProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isDecoding) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
        <Zap className="size-4 animate-pulse text-primary" />
        <span>正在分析编码格式...</span>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
        <Zap className="size-8 text-muted-foreground/40" />
        <span>解码候选结果将显示在这里</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        {usedBruteForce ? (
          <>
            <AlertTriangle className="size-3.5 text-warning" />
            <span>未识别标准编码格式，已执行暴力遍历</span>
          </>
        ) : (
          <>
            <Zap className="size-3.5 text-primary" />
            <span>已识别编码格式，共 {candidates.length} 条候选</span>
          </>
        )}
      </div>
      {candidates.map((cand, index) => {
        const key = `${cand.type}-${index}`;
        const isOpen = expanded.has(key);
        return (
          <Card key={key} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    {cand.type}
                  </Badge>
                  {cand.isBruteForce && (
                    <Badge variant="outline" className="text-warning border-warning/40">暴力</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{cand.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${cand.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                      {cand.confidence}%
                    </span>
                  </div>
                  <Button
                    variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={() => toggleExpand(key)}
                  >
                    {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    步骤
                  </Button>
                </div>
              </div>
              <pre className="p-2 bg-muted/30 rounded-md text-xs font-mono whitespace-pre-wrap break-all text-foreground max-h-32 overflow-auto">
                {cand.result}
              </pre>
              {isOpen && (
                <div className="mt-2 pt-2 border-t border-border">
                  <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                    {cand.steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              )}
              <Button
                variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs"
                onClick={() => onUseResult(cand.result)}
              >
                <ArrowRight className="size-3.5" />
                用作输入继续解码
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DecodeResults;
