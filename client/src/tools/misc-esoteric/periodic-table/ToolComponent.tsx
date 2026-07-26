import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ELEMENTS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
  'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
];

const ELEMENT_TO_NUM: Record<string, number> = {};
ELEMENTS.forEach((el: string, i: number) => {
  ELEMENT_TO_NUM[el] = i;
  if (el.length === 1) {
    ELEMENT_TO_NUM[el.toLowerCase()] = i;
  }
});

function lookupElement(token: string): number | undefined {
  const matched = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  const lower = token.toLowerCase();
  return ELEMENT_TO_NUM[matched] ?? ELEMENT_TO_NUM[token] ?? ELEMENT_TO_NUM[lower];
}

function encodeToElements(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const result: string[] = [];
  for (const b of bytes) {
    result.push(ELEMENTS[Math.floor(b / 118)] + ' ' + ELEMENTS[b % 118]);
  }
  return result.join('  ');
}

function decodeFromElements(text: string): string {
  const pairs = text.trim().split(/\s{2,}/).filter((p: string) => p.length > 0);
  const bytes: number[] = [];
  for (const pair of pairs) {
    const tokens = pair.trim().split(/\s+/);
    if (tokens.length < 2) continue;
    const num1 = lookupElement(tokens[0]);
    const num2 = lookupElement(tokens[1]);
    if (num1 !== undefined && num2 !== undefined) {
      bytes.push(num1 * 118 + num2);
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：元素序列无效';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromElements(input);
      return encodeToElements(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
