import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const CARDS: string[] = [];
for (const suit of SUITS) {
  for (const rank of RANKS) {
    CARDS.push(rank + suit);
  }
}

const CARD_MAP: Record<string, number> = {};
CARDS.forEach((card: string, i: number) => {
  CARD_MAP[card] = i;
});

function encodeToCards(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const result: string[] = [];
  for (const b of bytes) {
    result.push(CARDS[Math.floor(b / 52)] + ' ' + CARDS[b % 52]);
  }
  return result.join('  ');
}

function decodeFromCards(text: string): string {
  const pairs = text.trim().split(/\s{2,}/).filter((p: string) => p.length > 0);
  const bytes: number[] = [];
  for (const pair of pairs) {
    const tokens = pair.trim().split(/\s+/);
    if (tokens.length < 2) continue;
    const idx1 = CARD_MAP[tokens[0]];
    const idx2 = CARD_MAP[tokens[1]];
    if (idx1 !== undefined && idx2 !== undefined) {
      bytes.push(idx1 * 52 + idx2);
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：扑克牌序列无效';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromCards(input);
      return encodeToCards(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
