import { Plus, X, ChevronUp, ChevronDown, Copy, Check, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ENCODE_ONLY_CODECS, CODEC_MAP, type EncodeLayer } from '@/lib/codecs';
import { ENCODE_PRESETS } from '@/lib/smart-codec-utils';
import { toast } from 'sonner';

interface EncodeChainEditorProps {
  chain: EncodeLayer[];
  previews: { layer: number; codecName: string; param: string; result: string }[];
  error?: string;
  roundTrip: { verified: boolean; decoded: string; failedLayer?: number } | null;
  onAdd: (codecName: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<EncodeLayer>) => void;
  onMove: (from: number, to: number) => void;
  onApplyPreset: (chain: EncodeLayer[]) => void;
  onApplyRecommendation: (plaintext: string, unreadability: number) => void;
  input: string;
}

const UNREADABILITY_LABELS = ['', '轻度混淆', '中度混淆', '较强混淆', '高强度', '极限混淆'];

const EncodeChainEditor = ({
  chain, previews, error, roundTrip,
  onAdd, onRemove, onUpdate, onMove, onApplyPreset, onApplyRecommendation, input,
}: EncodeChainEditorProps) => {
  const [unreadability, setUnreadability] = useState(3);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('复制失败'); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select onValueChange={onAdd}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <Plus className="size-3 mr-1" />
            <SelectValue placeholder="添加编码层" />
          </SelectTrigger>
          <SelectContent>
            {ENCODE_ONLY_CODECS.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => {
          const preset = ENCODE_PRESETS.find((p) => p.name === v);
          if (preset) onApplyPreset(preset.chain);
        }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="预设模板" />
          </SelectTrigger>
          <SelectContent>
            {ENCODE_PRESETS.map((p) => (
              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">不可读度</Label>
          <Select value={String(unreadability)} onValueChange={(v) => {
            const n = parseInt(v, 10);
            setUnreadability(n);
            onApplyRecommendation(input, n);
          }}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} - {UNREADABILITY_LABELS[n]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chain.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm gap-1">
          <Plus className="size-6 text-muted-foreground/40" />
          <span>添加编码层开始构建编码链</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {chain.map((layer, i) => {
            const codec = CODEC_MAP[layer.codecName];
            const preview = previews.find((p) => p.layer === i + 1);
            return (
              <div key={i} className="flex flex-col gap-1 p-2 bg-muted/30 rounded-md border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                  <Badge variant="secondary" className="text-xs">{layer.codecName}</Badge>
                  {codec?.param && (
                    <Input
                      className="h-7 w-28 text-xs"
                      placeholder={codec.param.placeholder}
                      value={layer.param}
                      onChange={(e) => onUpdate(i, { param: e.target.value })}
                    />
                  )}
                  <div className="flex gap-0.5 ml-auto">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === 0}
                      onClick={() => onMove(i, i - 1)}>
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={i === chain.length - 1}
                      onClick={() => onMove(i, i + 1)}>
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => onRemove(i)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {preview && (
                  <div className="pl-8 text-xs font-mono text-muted-foreground truncate">
                    → {preview.result.slice(0, 80)}{preview.result.length > 80 ? '...' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive px-2">
          <XCircle className="size-3.5" />
          {error}
        </div>
      )}

      {roundTrip && (
        <div className={`flex items-center gap-2 text-xs px-2 ${roundTrip.verified ? 'text-success' : 'text-destructive'}`}>
          {roundTrip.verified ? (
            <><CheckCircle2 className="size-3.5" /> 往返验证一致</>
          ) : (
            <><XCircle className="size-3.5" /> 往返验证失败{roundTrip.failedLayer ? `（第${roundTrip.failedLayer}层不可逆）` : '（结果不匹配）'}</>
          )}
        </div>
      )}
    </div>
  );
};

export default EncodeChainEditor;
