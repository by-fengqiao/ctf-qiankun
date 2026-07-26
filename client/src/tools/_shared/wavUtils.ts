import { readU16LE, readU32LE } from './hexUtils';

export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  audioFormat: number;
  dataOffset: number;
  dataSize: number;
}

export function parseWav(bytes: Uint8Array): WavInfo | null {
  if (bytes.length < 44) return null;
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riff !== 'RIFF') return null;
  const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (wave !== 'WAVE') return null;
  const fmtSize = readU32LE(bytes, 16);
  const audioFormat = readU16LE(bytes, 20);
  const channels = readU16LE(bytes, 22);
  const sampleRate = readU32LE(bytes, 24);
  const bitsPerSample = readU16LE(bytes, 34);
  let offset = 20 + fmtSize;
  if (offset % 2 !== 0) offset += 1;
  let dataOffset = 0;
  let dataSize = 0;
  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const chunkSize = readU32LE(bytes, offset + 4);
    if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
    if (offset % 2 !== 0) offset += 1;
  }
  return { sampleRate, channels, bitsPerSample, audioFormat, dataOffset, dataSize };
}

export function extractSamples(
  bytes: Uint8Array,
  info: WavInfo,
  maxSamples = 300000,
): number[] {
  const { dataOffset, dataSize, channels, bitsPerSample } = info;
  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * channels;
  const maxCount = Math.min(
    Math.floor(dataSize / frameSize),
    Math.floor((bytes.length - dataOffset) / frameSize),
    maxSamples,
  );
  const samples: number[] = [];
  for (let i = 0; i < maxCount; i++) {
    const offset = dataOffset + i * frameSize;
    let sample = 0;
    for (let b = 0; b < bytesPerSample; b++) {
      sample |= bytes[offset + b] << (b * 8);
    }
    if (bitsPerSample === 16) {
      if (sample > 32767) sample -= 65536;
    } else if (bitsPerSample === 8) {
      sample -= 128;
    }
    samples.push(sample);
  }
  return samples;
}

export function getBytes(file: File | null, hex: string): Promise<Uint8Array> {
  if (file) {
    return file.arrayBuffer().then((buf: ArrayBuffer) => new Uint8Array(buf));
  }
  return Promise.resolve(parseHexLocal(hex));
}

function parseHexLocal(input: string): Uint8Array {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s:,-]/g, '').toUpperCase();
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符串长度必须为偶数');
  }
  if (!/^[0-9A-F]*$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}
