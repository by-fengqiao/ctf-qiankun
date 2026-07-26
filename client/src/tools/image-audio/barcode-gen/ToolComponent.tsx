import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const CODE39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';

const CODE39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn',
  'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww',
  'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww',
  'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn',
  'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn',
  '*': 'nwnnwnwnn', '$': 'nwnwnwnnn', '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
};

const REVERSE_CODE39: Record<string, string> = {};
for (const [ch, pattern] of Object.entries(CODE39_PATTERNS)) {
  if (!(pattern in REVERSE_CODE39)) {
    REVERSE_CODE39[pattern] = ch;
  }
}

const NARROW = 1;
const WIDE = 3;
const BAR_HEIGHT = 80;
const TEXT_HEIGHT = 20;
const PADDING = 10;

function buildBars(input: string): { bars: number[]; isValid: boolean; error?: string } {
  const upper = input.toUpperCase();
  const invalid = upper.split('').find((c: string) => !CODE39_CHARS.includes(c));
  if (invalid) return { bars: [], isValid: false, error: `包含不支持的字符: "${invalid}"` };
  const data = `*${upper}*`;
  const bars: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const ch = data[i];
    const pattern = CODE39_PATTERNS[ch] ?? CODE39_PATTERNS['*'];
    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const width = pattern[j] === 'n' ? NARROW : WIDE;
      bars.push(isBar ? width : -width);
    }
    if (i < data.length - 1) {
      bars.push(-NARROW);
    }
  }
  return { bars, isValid: true };
}

function drawBarcodeCanvas(input: string): string {
  const { bars, isValid, error } = buildBars(input);
  if (!isValid) return error ?? '编码失败';

  const totalWidth = bars.reduce((sum: number, w: number) => sum + Math.abs(w), 0) + PADDING * 2;
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = BAR_HEIGHT + TEXT_HEIGHT + PADDING * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'Canvas 不可用';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = PADDING;
  for (const w of bars) {
    const width = Math.abs(w);
    if (w > 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, PADDING, width, BAR_HEIGHT);
    }
    x += width;
  }

  ctx.fillStyle = '#000000';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(input.toUpperCase(), canvas.width / 2, canvas.height - PADDING - 4);

  return canvas.toDataURL('image/png');
}

function decodeBarcode(input: string): string {
  let pattern = input;
  const barcodeMatch = input.match(/── 条形码图案 ──\s*\n(.+?)(?:\n──|$)/s);
  if (barcodeMatch) {
    pattern = barcodeMatch[1].trim();
  }
  const charBlocks = pattern.split(/\s{2,}/).filter((s: string) => s.trim());
  if (charBlocks.length === 0) return '未找到条形码图案，请粘贴条形码图案或完整输出';

  let result = '';
  let started = false;
  for (const block of charBlocks) {
    const bars = block.split(' ').filter((s: string) => s.length > 0);
    if (bars.length !== 10) continue;
    const patternStr = bars.map((b: string) => b.length <= 1 ? 'n' : 'w').join('');
    const char = REVERSE_CODE39[patternStr];
    if (char) {
      if (char === '*') {
        if (!started) started = true;
        else break;
      } else {
        result += char;
      }
    }
  }
  if (!result) return '未能识别条形码图案';
  return [
    'Code39 解码结果',
    `内容: ${result}`,
    `字符数: ${result.length}`,
  ].join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'generate', label: '生成' },
      { value: 'decode', label: '解码' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeBarcode(input);
      if (!input.trim()) return '请输入要编码的文本（仅大写字母、数字、- . $ / + % 空格）';
      const upper = input.toUpperCase();
      const dataUrl = drawBarcodeCanvas(upper);
      if (dataUrl.startsWith('包含不支持') || dataUrl === 'Canvas 不可用') return dataUrl;
      return [
        'Code39 条形码已生成',
        `内容: ${upper}`,
        `格式: Code39 (含起始/终止符 *)`,
        `字符集: ${upper.length} 个字符`,
        '',
        dataUrl,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
