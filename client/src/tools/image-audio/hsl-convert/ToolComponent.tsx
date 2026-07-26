import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hslConvert = (input: string): string => {
  const hexMatch = input.match(/^#?([0-9a-fA-F]{6})$/);
  const rgbMatch = input.match(/rgb\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)?/i);
  let r = 0, g = 0, b = 0;
  if (hexMatch) {
    const hex = hexMatch[1];
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
  } else {
    throw new Error('请输入 HEX (如 #408bd1) 或 RGB (如 rgb(64,139,209)) 格式');
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    const s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
    if (max === r) h = ((g - b) / delta) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    return [
      `HSL: hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      `H: ${Math.round(h)}°`,
      `S: ${Math.round(s * 100)}%`,
      `L: ${Math.round(l * 100)}%`,
      `HEX: #${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`,
      `RGB: rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
    ].join('\n');
  }
  return [
    `HSL: hsl(0, 0%, ${Math.round(l * 100)}%)`,
    `L: ${Math.round(l * 100)}%`,
    `HEX: #${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`,
    `RGB: rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
  ].join('\n');
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const hslFromInput = (input: string): string => {
  const hslMatch = input.match(/hsl\(?\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*%?\s*,\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (!hslMatch) throw new Error('请输入 HSL 格式 (如 hsl(210, 64%, 54%))');
  const h = parseFloat(hslMatch[1]);
  const s = parseFloat(hslMatch[2]);
  const l = parseFloat(hslMatch[3]);
  const [r, g, b] = hslToRgb(h, s, l);
  const hex = '#' + [r, g, b].map((c: number) => c.toString(16).padStart(2, '0')).join('');
  return [
    `HEX: ${hex}`,
    `RGB: rgb(${r}, ${g}, ${b})`,
    `HSL: hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return hslFromInput(input);
      return hslConvert(input);
    }}
    modeOptions={[
      { value: 'encode', label: 'HEX/RGB→HSL' },
      { value: 'decode', label: 'HSL→HEX/RGB' },
    ]}
  />
);
export default ToolComponent;
