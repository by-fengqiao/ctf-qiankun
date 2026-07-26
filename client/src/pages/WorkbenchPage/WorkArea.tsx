import { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Eraser, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ToolTabs from '@/components/workbench/ToolTabs';
import InputPanel from '@/components/workbench/InputPanel';
import OutputPanel from '@/components/workbench/OutputPanel';
import FileDropZone from '@/components/workbench/FileDropZone';
import ToolButton from '@/components/workbench/ToolButton';
import ToolPanel from '@/components/workbench/ToolPanel';
import { useWorkbenchStore } from '@/store/workbench-store';
import type { TabState } from '@/store/workbench-store';
import type { ToolDefinition } from '@/tools/types';
import ToolGrid from './ToolGrid';

interface WorkAreaProps {
  filteredTools: ToolDefinition[];
}

const WorkArea = ({ filteredTools }: WorkAreaProps) => {
  const [file, setFile] = useState<File | null>(null);
  const tabs = useWorkbenchStore((s) => s.tabs);
  const activeTabId = useWorkbenchStore((s) => s.activeTabId);
  const switchTab = useWorkbenchStore((s) => s.switchTab);
  const closeTab = useWorkbenchStore((s) => s.closeTab);
  const updateInput = useWorkbenchStore((s) => s.updateInput);
  const updateOutput = useWorkbenchStore((s) => s.updateOutput);
  const updateParams = useWorkbenchStore((s) => s.updateParams);
  const swapInputOutput = useWorkbenchStore((s) => s.swapInputOutput);
  const clearInput = useWorkbenchStore((s) => s.clearInput);
  const openTool = useWorkbenchStore((s) => s.openTool);
  const triggerAI = useWorkbenchStore((s) => s.triggerAI);
  const setViewMode = useWorkbenchStore((s) => s.setViewMode);

  useEffect(() => {
    setFile(null);
  }, [activeTabId]);

  const activeTab: TabState | undefined = tabs.find(
    (t: TabState) => t.toolId === activeTabId
  );

  const handleCopyOutput = async () => {
    if (!activeTab?.output) return;
    try {
      await navigator.clipboard.writeText(activeTab.output);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownloadOutput = () => {
    if (!activeTab?.output) return;
    const blob = new Blob([activeTab.output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyzeWithAI = () => {
    if (!activeTab?.output) return;
    triggerAI(
      `分析以下工具执行结果，尝试解出 flag：\n\n${activeTab.output}`,
      {
        toolId: activeTab.toolId,
        toolInput: activeTab.input,
        toolOutput: activeTab.output,
      },
      true,
    );
  };

  if (!activeTab) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
        <ToolGrid tools={filteredTools} onOpenTool={openTool} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <ToolTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitch={switchTab}
        onClose={closeTab}
      />
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
        <div className="flex-1 flex flex-col gap-2 min-h-0 md:max-h-full">
          <InputPanel
            value={activeTab.input}
            onChange={updateInput}
            placeholder="在此输入文本..."
          />
          <FileDropZone
            onFileLoad={(content: string) => updateInput(content)}
            onFileSelect={(f: File) => setFile(f)}
          />
        </div>
        <div className="flex-1 min-h-0 md:min-h-0">
          <OutputPanel value={activeTab.output} />
        </div>
      </div>
      <div
        data-ai-section-type="button"
        className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-t border-border bg-card"
      >
        <ToolPanel
          toolId={activeTab.toolId}
          input={activeTab.input}
          output={activeTab.output}
          setOutput={updateOutput}
          params={activeTab.params}
          setParams={updateParams}
          file={file}
          setFile={setFile}
        />
        <div className="flex-1" />
        <ToolButton
          variant="execute"
          onClick={handleAnalyzeWithAI}
          disabled={!activeTab.output}
        >
          <Sparkles className="size-3.5" />
          AI Agent 解题
        </ToolButton>
        <ToolButton variant="swap" onClick={swapInputOutput}>
          <ArrowLeftRight className="size-3.5" />
          交换
        </ToolButton>
        <ToolButton
          variant="copy"
          onClick={handleCopyOutput}
          disabled={!activeTab.output}
        >
          <Copy className="size-3.5" />
          复制
        </ToolButton>
        <ToolButton variant="clear" onClick={clearInput}>
          <Eraser className="size-3.5" />
          清空
        </ToolButton>
        <ToolButton
          variant="download"
          onClick={handleDownloadOutput}
          disabled={!activeTab.output}
        >
          <Download className="size-3.5" />
          下载
        </ToolButton>
      </div>
    </div>
  );
};

export default WorkArea;
