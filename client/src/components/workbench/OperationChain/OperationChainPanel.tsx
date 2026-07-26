import { useState } from 'react';
import { Play, Plus, Trash2, ArrowUp, ArrowDown, Save, Link2, BookOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationChain } from '@/hooks/useOperationChain';
import type { ChainStep, Recipe, OperationDef } from '@/hooks/useOperationChain';

const OperationChainPanel = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [selectedOp, setSelectedOp] = useState('');
  const [recipeName, setRecipeName] = useState('');

  const {
    steps, recipes, operations, addStep, removeStep, moveStep,
    executeChain, saveRecipe, loadRecipe, deleteRecipe, clearSteps, presetChains,
  } = useOperationChain();

  const handleAdd = (): void => {
    if (!selectedOp) { toast.warning('请先选择一个操作'); return; }
    const op = operations.find((o: OperationDef) => o.id === selectedOp);
    if (!op) return;
    addStep(op.id, op.name);
    setSelectedOp('');
  };

  const handleExecute = (): void => {
    if (steps.length === 0) { toast.warning('请先添加操作步骤'); return; }
    const result = executeChain(input);
    setOutput(result);
    toast.success('链执行完成');
  };

  const handleSaveRecipe = (): void => {
    if (steps.length === 0) { toast.warning('当前链为空'); return; }
    if (!recipeName.trim()) { toast.warning('请输入配方名称'); return; }
    saveRecipe(recipeName.trim());
    setRecipeName('');
    toast.success('配方已保存');
  };

  const handleClear = (): void => {
    clearSteps();
    setOutput('');
  };

  const handleLoadPreset = (preset: { name: string; steps: { toolId: string; toolName: string }[] }): void => {
    loadRecipe(preset);
    toast.success(`已加载预设: ${preset.name}`);
  };

  const handleLoadRecipe = (recipe: Recipe): void => {
    loadRecipe(recipe);
    toast.success(`已加载配方: ${recipe.name}`);
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="size-4 text-primary" />
        <span>操作链构建器</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入待处理的文本..."
            className="min-h-[80px] font-mono text-sm"
          />

          <div className="flex gap-2">
            <Select value={selectedOp} onValueChange={setSelectedOp}>
              <SelectTrigger className="flex-1 h-9" size="sm">
                <SelectValue placeholder="选择操作..." />
              </SelectTrigger>
              <SelectContent>
                {operations.map((op: OperationDef) => (
                  <SelectItem key={op.id} value={op.id}>
                    <Badge variant="outline" className="mr-1 text-[10px] px-1 py-0">
                      {op.category === 'decode' ? '解' : op.category === 'encode' ? '编' : '换'}
                    </Badge>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} size="sm" disabled={!selectedOp}>
              <Plus className="size-3.5" />
              添加
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <Layers className="size-6 text-muted-foreground/40" />
                <span>添加操作步骤来构建处理链</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pr-2">
                {steps.map((step: ChainStep, index: number) => (
                  <Card key={step.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">{step.toolName}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="size-7"
                            disabled={index === 0}
                            onClick={() => moveStep(index, 'up')}
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-7"
                            disabled={index === steps.length - 1}
                            onClick={() => moveStep(index, 'down')}
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-7 text-destructive"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      {step.input && (
                        <div className="text-xs text-muted-foreground font-mono truncate mb-0.5">
                          <span className="text-muted-foreground/60">in: </span>{step.input.slice(0, 80)}
                        </div>
                      )}
                      {step.output && (
                        <div className="text-xs text-foreground font-mono truncate">
                          <span className="text-muted-foreground/60">out: </span>{step.output.slice(0, 80)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Button onClick={handleExecute} size="sm" disabled={steps.length === 0}>
              <Play className="size-3.5" />
              执行链
            </Button>
            <div className="flex gap-1 flex-1">
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="配方名称"
                className="h-8 text-xs"
              />
              <Button onClick={handleSaveRecipe} variant="outline" size="sm" disabled={steps.length === 0}>
                <Save className="size-3.5" />
                保存
              </Button>
            </div>
            <Button onClick={handleClear} variant="ghost" size="sm" disabled={steps.length === 0}>
              <Trash2 className="size-3.5" />
              清空
            </Button>
          </div>

          {output && (
            <pre className="p-2 bg-muted/30 rounded-md text-xs font-mono whitespace-pre-wrap break-all text-foreground max-h-32 overflow-auto border border-border">
              {output}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="size-3.5" />
              预设链
            </div>
            <div className="flex flex-col gap-1.5">
              {presetChains.map((preset: { name: string; steps: { toolId: string; toolName: string }[] }) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-1.5 text-xs"
                  onClick={() => handleLoadPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-h-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Save className="size-3.5" />
              已保存配方
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {recipes.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 py-4 text-center">
                  暂无保存的配方
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pr-2">
                  {recipes.map((recipe: Recipe) => (
                    <div key={recipe.id} className="flex items-center gap-1 group">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start h-auto py-1.5 text-xs"
                        onClick={() => handleLoadRecipe(recipe)}
                      >
                        <span className="truncate">{recipe.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => deleteRecipe(recipe.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationChainPanel;
