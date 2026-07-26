import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

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

const rgbToCmyk = (r: number, g: number, b: number): [number, number, number, number] => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 1) return [0, 0, 0, 100];
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
};

const colorName = (r: number, g: number, b: number): string => {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 10) {
    if (l < 15) return '黑色';
    if (l > 85) return '白色';
    if (l < 35) return '深灰';
    if (l > 65) return '浅灰';
    return '灰色';
  }
  const hueNames: [number, string][] = [
    [15, '红色'], [45, '橙色'], [65, '黄色'], [165, '绿色'],
    [195, '青色'], [255, '蓝色'], [285, '紫色'], [345, '品红'], [360, '红色'],
  ];
  let name = '红色';
  for (const [maxHue, hueName] of hueNames) {
    if (h <= maxHue) { name = hueName; break; }
  }
  if (l < 30) return `深${name}`;
  if (l > 70) return `浅${name}`;
  if (s < 40) return `暗${name}`;
  return name;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '请输入颜色值（如 #FF5733）';
      const rgb = hexToRgb(trimmed);
      if (!rgb) return '无效的 HEX 颜色格式，请输入如 #FF5733';
      const [r, g, b] = rgb;
      const [hh, hs, hl] = rgbToHsl(r, g, b);
      const [vh, vs, vv] = rgbToHsv(r, g, b);
      const [cc, cm, cy, ck] = rgbToCmyk(r, g, b);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const perceivedBrightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
      return [
        '颜色采样分析',
        '',
        `HEX:   ${trimmed.toUpperCase()}`,
        `RGB:   rgb(${r}, ${g}, ${b})`,
        `HSL:   hsl(${hh}, ${hs}%, ${hl}%)`,
        `HSV:   hsv(${vh}, ${vs}%, ${vv}%)`,
        `CMYK:  cmyk(${cc}%, ${cm}%, ${cy}%, ${ck}%)`,
        '',
        '── 颜色属性 ──',
        `  颜色名称: ${colorName(r, g, b)}`,
        `  色相: ${hh}°`,
        `  饱和度: ${hs}% (HSL)`,
        `  亮度: ${hl}% (HSL) / ${vv}% (HSV)`,
        '',
        '── 亮度分析 ──',
        `  相对亮度: ${(luminance * 100).toFixed(1)}%`,
        `  感知亮度: ${(perceivedBrightness / 255 * 100).toFixed(1)}%`,
        `  文字对比: ${luminance > 0.5 ? '建议使用深色文字' : '建议使用浅色文字'}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
