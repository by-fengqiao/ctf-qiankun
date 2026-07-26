import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hsvConvert = (input: string): string => {
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
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;
  return [
    `HSV: hsv(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(v)}%)`,
    `H: ${Math.round(h)}°`,
    `S: ${Math.round(s)}%`,
    `V: ${Math.round(v)}%`,
    `HEX: #${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`,
    `RGB: rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
  ].join('\n');
};

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  h /= 360; s /= 100; v /= 100;
  let r: number, g: number, b: number;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const hsvFromInput = (input: string): string => {
  const hsvMatch = input.match(/hsv\(?\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*%?\s*,\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (!hsvMatch) throw new Error('请输入 HSV 格式 (如 hsv(210, 69%, 82%))');
  const h = parseFloat(hsvMatch[1]);
  const s = parseFloat(hsvMatch[2]);
  const v = parseFloat(hsvMatch[3]);
  const [r, g, b] = hsvToRgb(h, s, v);
  const hex = '#' + [r, g, b].map((c: number) => c.toString(16).padStart(2, '0')).join('');
  return [
    `HEX: ${hex}`,
    `RGB: rgb(${r}, ${g}, ${b})`,
    `HSV: hsv(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(v)}%)`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return hsvFromInput(input);
      return hsvConvert(input);
    }}
    modeOptions={[
      { value: 'encode', label: 'HEX/RGB→HSV' },
      { value: 'decode', label: 'HSV→HEX/RGB' },
    ]}
  />
);
export default ToolComponent;
