import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { getToolEntry, getToolDefinition } from '@/tools/registry';
import type { ToolProps, ToolMode } from '@/tools/types';

interface ToolPanelProps {
  toolId: string;
  input: string;
  output: string;
  setOutput: (value: string) => void;
  params: Record<string, unknown>;
  setParams: (params: Record<string, unknown>) => void;
  file: File | null;
  setFile: (file: File | null) => void;
}

const ToolPanel = ({
  toolId,
  input,
  output,
  setOutput,
  params,
  setParams,
  file,
  setFile,
}: ToolPanelProps) => {
  const [Component, setComponent] = useState<ComponentType<ToolProps> | null>(null);
  const definition = getToolDefinition(toolId);

  useEffect(() => {
    let cancelled = false;
    const entry = getToolEntry(toolId);
    if (!entry) {
      setComponent(null);
      return;
    }
    setComponent(null);
    entry.componentLoader().then((mod) => {
      if (!cancelled) setComponent(() => mod.default as ComponentType<ToolProps>);
    });
    return () => { cancelled = true; };
  }, [toolId]);

  if (!definition) return null;
  if (!Component) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        加载工具中...
      </div>
    );
  }

  const mode = (params.mode as ToolMode) ?? definition.modes[0];

  return (
    <Component
      input={input}
      output={output}
      setOutput={setOutput}
      mode={mode}
      params={params}
      setParams={setParams}
      file={file}
      setFile={setFile}
    />
  );
};

export default ToolPanel;
