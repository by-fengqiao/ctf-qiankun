import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const parseRgb = (input: string): [number, number, number] | null => {
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
};

const formatAll = (r: number, g: number, b: number): string => {
  const [hh, hs, hl] = rgbToHsl(r, g, b);
  const [vh, vs, vv] = rgbToHsv(r, g, b);
  return [
    '颜色格式转换结果',
    '',
    `HEX:   ${rgbToHex(r, g, b)}`,
    `RGB:   rgb(${r}, ${g}, ${b})`,
    `HSL:   hsl(${hh}, ${hs}%, ${hl}%)`,
    `HSV:   hsv(${vh}, ${vs}%, ${vv}%)`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: 'HEX→RGB' },
      { value: 'decode', label: 'RGB→HEX' },
    ]}
    execute={(input: string, mode: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '请输入颜色值（如 #408bd1 或 rgb(64,139,209)）';
      if (mode === 'encode') {
        const rgb = hexToRgb(trimmed);
        if (!rgb) return '无效的 HEX 格式，请输入如 #408bd1 或 408bd1';
        return formatAll(rgb[0], rgb[1], rgb[2]);
      }
      const rgb = parseRgb(trimmed);
      if (!rgb) return '无效的 RGB 格式，请输入如 rgb(64,139,209)';
      return formatAll(rgb[0], rgb[1], rgb[2]);
    }}
  />
);

export default ToolComponent;
