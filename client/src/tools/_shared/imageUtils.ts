import { parseHex } from './hexUtils';

export interface DecodedImage {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

const MAX_DIMENSION = 2000;

export async function decodeImage(
  file: File | null,
  hex: string,
): Promise<DecodedImage> {
  let bytes: Uint8Array;
  if (file) {
    bytes = new Uint8Array(await file.arrayBuffer());
  } else {
    bytes = parseHex(hex);
  }
  if (bytes.length < 8) {
    throw new Error('数据不足，无法解析图片');
  }
  const ab = new ArrayBuffer(bytes.length);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab]);
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    let w = img.width;
    let h = img.height;
    if (w <= 0 || h <= 0) {
      throw new Error('图片尺寸无效');
    }
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context 不可用');
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, pixels: imageData.data };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('图片解码失败，请确认文件格式为 PNG/JPEG/BMP'));
    img.src = url;
  });
}

export async function loadImageToCanvas(
  file: File,
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let w = img.width;
    let h = img.height;
    if (w <= 0 || h <= 0) {
      throw new Error('图片尺寸无效');
    }
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context 不可用');
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    return { canvas, ctx, imageData, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function channelStats(
  data: Uint8ClampedArray,
  channelOffset: number,
  step: number,
): { min: number; max: number; avg: number } {
  let min = 255;
  let max = 0;
  let sum = 0;
  let count = 0;
  for (let i = channelOffset; i < data.length; i += step) {
    const v = data[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    count++;
  }
  return { min, max, avg: count > 0 ? Math.round(sum / count) : 0 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getLuminance(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
