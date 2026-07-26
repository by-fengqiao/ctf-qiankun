import { useState } from 'react';
import { ArrowLeftRight, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSmartCodec } from '@/hooks/useSmartCodec';
import { ENCODE_PRESETS } from '@/lib/smart-codec-utils';
import DecodeResults from './DecodeResults';
import EncodeChainEditor from './EncodeChainEditor';
import { toast } from 'sonner';

const PREFIX_PRESETS = [
  { label: 'flag{', value: 'flag{', suffix: '}' },
  { label: 'FLAG{', value: 'FLAG{', suffix: '}' },
  { label: 'CTF{', value: 'CTF{', suffix: '}' },
  { label: 'key{', value: 'key{', suffix: '}' },
  { label: '无', value: '', suffix: '' },
];

const SmartCodecPanel = () => {
  const [copied, setCopied] = useState(false);
  const {
    direction, switchDirection,
    input, setInput, output,
    candidates, isDecoding, usedBruteForce,
    encodeChain, addEncodeLayer, removeEncodeLayer, updateEncodeLayer, moveEncodeLayer,
    encodePreviews, encodeError, roundTrip,
    expected, setExpected,
    truncated, clearAll, applyPreset, applyRecommendation,
  } = useSmartCodec();

  const handleUseResult = (result: string) => {
    setInput(result);
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('复制失败'); }
  };

  const handlePrefixPreset = (preset: string) => {
    const p = PREFIX_PRESETS.find((x) => x.label === preset);
    if (p) setExpected({ ...expected, prefix: p.value, suffix: p.suffix });
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-md p-0.5">
          <button
            onClick={() => direction !== 'decode' && switchDirection()}
            className={`flex items-center gap-1.5 px-4 py-1 rounded text-xs font-medium transition-colors ${
              direction === 'decode' ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            解码
          </button>
          <button
            onClick={() => direction !== 'encode' && switchDirection()}
            className={`flex items-center gap-1.5 px-4 py-1 rounded text-xs font-medium transition-colors ${
              direction === 'encode' ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            编码
          </button>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={switchDirection}>
          <ArrowLeftRight className="size-3.5" />
          互换
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
          <Trash2 className="size-3.5" />
          清空
        </Button>
      </div>

      {truncated && (
        <div className="flex items-center gap-2 text-xs text-warning px-2">
          <AlertTriangle className="size-3.5" />
          输入超过 1MB，已截断处理
        </div>
      )}

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={direction === 'decode' ? '粘贴需要解码的文本，引擎将自动识别编码类型...' : '输入要编码的明文...'}
        className="min-h-[100px] font-mono text-sm resize-y"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">预期开头</Label>
          <Input
            className="h-7 w-24 text-xs font-mono"
            value={expected.prefix}
            onChange={(e) => setExpected({ ...expected, prefix: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">预期结尾</Label>
          <Input
            className="h-7 w-24 text-xs font-mono"
            value={expected.suffix}
            onChange={(e) => setExpected({ ...expected, suffix: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={expected.useRegex}
            onCheckedChange={(v) => setExpected({ ...expected, useRegex: v })}
            className="scale-75"
          />
          <Label className="text-xs text-muted-foreground">正则</Label>
        </div>
        <Select onValueChange={handlePrefixPreset}>
          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="预设" /></SelectTrigger>
          <SelectContent>
            {PREFIX_PRESETS.map((p) => (
              <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {direction === 'decode' ? (
          <DecodeResults
            candidates={candidates}
            isDecoding={isDecoding}
            usedBruteForce={usedBruteForce}
            onUseResult={handleUseResult}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <EncodeChainEditor
              chain={encodeChain}
              previews={encodePreviews}
              error={encodeError}
              roundTrip={roundTrip}
              onAdd={addEncodeLayer}
              onRemove={removeEncodeLayer}
              onUpdate={updateEncodeLayer}
              onMove={moveEncodeLayer}
              onApplyPreset={applyPreset}
              onApplyRecommendation={applyRecommendation}
              input={input}
            />
            {output && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">编码输出</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopyOutput}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    复制
                  </Button>
                </div>
                <pre className="p-2 bg-muted/30 rounded-md text-xs font-mono whitespace-pre-wrap break-all text-foreground max-h-40 overflow-auto">
                  {output}
                </pre>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SmartCodecPanel;
