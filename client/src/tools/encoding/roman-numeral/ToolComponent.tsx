import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ROMAN_MAP: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'],
  [1, 'I'],
];

const toRoman = (num: number): string => {
  let result = '';
  let remaining = num;
  for (const [val, sym] of ROMAN_MAP) {
    while (remaining >= val) {
      result += sym;
      remaining -= val;
    }
  }
  return result;
};

const fromRoman = (str: string): string => {
  const romanVal: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
  };
  let total = 0;
  const upper = str.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const curr = romanVal[upper[i]];
    if (curr === undefined) throw new Error(`无效罗马字符: ${upper[i]}`);
    const next = i + 1 < upper.length ? romanVal[upper[i + 1]] : 0;
    if (next > curr) {
      total += next - curr;
      i++;
    } else {
      total += curr;
    }
  }
  return String(total);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          const num = parseInt(input.trim(), 10);
          if (isNaN(num) || num < 1 || num > 3999) {
            return '错误: 请输入 1-3999 之间的数字';
          }
          return toRoman(num);
        }
        return fromRoman(input.trim());
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '数字→罗马' },
      { value: 'decode', label: '罗马→数字' },
    ]}
  />
);

export default ToolComponent;
