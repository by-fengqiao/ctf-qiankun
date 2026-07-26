import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16LE, readU32LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
  bytes: Uint8Array;
}

function parseWav(bytes: Uint8Array): WavInfo {
  const riff = bytesToText(bytes.slice(0, 4));
  if (riff !== 'RIFF') throw new Error('非 RIFF/WAV 格式');
  const wave = bytesToText(bytes.slice(8, 12));
  if (wave !== 'WAVE') throw new Error('非 WAVE 格式');
  const fmtSize = readU32LE(bytes, 16);
  const sampleRate = readU32LE(bytes, 24);
  const channels = readU16LE(bytes, 22);
  const bitsPerSample = readU16LE(bytes, 34);
  let offset = 20 + fmtSize;
  if (offset % 2 !== 0) offset += 1;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset + 8 <= bytes.length) {
    const chunkId = bytesToText(bytes.slice(offset, offset + 4));
    const chunkSize = readU32LE(bytes, offset + 4);
    if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
    if (offset % 2 !== 0) offset += 1;
  }
  if (dataOffset < 0) throw new Error('未找到 data 块');
  return { sampleRate, channels, bitsPerSample, dataOffset, dataSize, bytes };
}

function extractSamples(wav: WavInfo, maxSamples: number): number[] {
  const { bytes, dataOffset, bitsPerSample, channels } = wav;
  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * channels;
  const available = Math.floor((bytes.length - dataOffset) / frameSize);
  const count = Math.min(maxSamples, available);
  const samples: number[] = [];
  for (let i = 0; i < count; i++) {
    const off = dataOffset + i * frameSize;
    if (bitsPerSample === 8) {
      samples.push(bytes[off] - 128);
    } else if (bitsPerSample === 16) {
      let s = bytes[off] | (bytes[off + 1] << 8);
      if (s > 32767) s -= 65536;
      samples.push(s);
    } else if (bitsPerSample === 24) {
      let s = bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16);
      if (s > 8388607) s -= 16777216;
      samples.push(s);
    } else if (bitsPerSample === 32) {
      let s = bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
      samples.push(s / 65536);
    }
  }
  return samples;
}

/** Radix-2 Cooley-Tukey FFT (in-place, size must be power of 2). */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  if (n <= 1) return;
  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tr = real[i]; real[i] = real[j]; real[j] = tr;
      const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
    }
  }
  // Butterfly
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;
      for (let k = 0; k < halfLen; k++) {
        const idx = i + k;
        const pairIdx = idx + halfLen;
        const tReal = curReal * real[pairIdx] - curImag * imag[pairIdx];
        const tImag = curReal * imag[pairIdx] + curImag * real[pairIdx];
        real[pairIdx] = real[idx] - tReal;
        imag[pairIdx] = imag[idx] - tImag;
        real[idx] += tReal;
        imag[idx] += tImag;
        const nextReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = nextReal;
      }
    }
  }
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

const MAX_SAMPLES = 65536;
const SPECTROGRAM_ROWS = 24;
const SPECTROGRAM_COLS = 64;
const INTENSITY_CHARS = ' .:-=+*#%@';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="音频频谱分析"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      let hex = input;
      if (file) hex = await readFileAsHex(file);
      if (!hex) return '请输入 WAV 音频的十六进制数据或拖入文件';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(hex);
      } catch {
        return '十六进制数据解析失败';
      }
      if (bytes.length < 44) return '数据不足，WAV 至少需要 44 字节';

      let wav: WavInfo;
      try {
        wav = parseWav(bytes);
      } catch (e) {
        return `WAV 解析失败: ${e instanceof Error ? e.message : '未知错误'}`;
      }

      const samples = extractSamples(wav, MAX_SAMPLES);
      const results: string[] = [
        '音频频谱分析',
        `采样率: ${wav.sampleRate} Hz`,
        `声道数: ${wav.channels}`,
        `位深度: ${wav.bitsPerSample} bit`,
        `分析采样数: ${samples.length}`,
        '',
      ];

      // Single FFT on entire sample set
      const fftSize = Math.min(nextPow2(samples.length), 65536);
      const real = new Float64Array(fftSize);
      const imag = new Float64Array(fftSize);
      const copyLen = Math.min(samples.length, fftSize);
      // Apply Hann window
      for (let i = 0; i < copyLen; i++) {
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (copyLen - 1)));
        real[i] = samples[i] * window;
      }
      fft(real, imag);

      // Compute magnitudes for first half (Nyquist)
      const halfBins = fftSize / 2;
      const mags: number[] = new Array(halfBins);
      let maxMag = 0;
      for (let i = 0; i < halfBins; i++) {
        mags[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        if (mags[i] > maxMag) maxMag = mags[i];
      }

      // Find top frequency peaks
      const freqResolution = wav.sampleRate / fftSize;
      const peaks: { freq: number; mag: number }[] = [];
      for (let i = 2; i < halfBins - 1; i++) {
        if (mags[i] > mags[i - 1] && mags[i] > mags[i + 1] && mags[i] > maxMag * 0.1) {
          peaks.push({ freq: i * freqResolution, mag: mags[i] });
        }
      }
      peaks.sort((a, b) => b.mag - a.mag);
      const topPeaks = peaks.slice(0, 10);

      results.push('── 主要频率峰值 ──');
      if (topPeaks.length === 0) {
        results.push('  (未检测到显著峰值)');
      } else {
        for (const p of topPeaks) {
          results.push(`  ${p.freq.toFixed(1).padStart(8)} Hz  | ${'#'.repeat(Math.round((p.mag / maxMag) * 30))}`);
        }
      }

      // Spectrogram: split samples into segments, FFT each
      results.push('', '── 频谱图 (ASCII 强度图) ──');
      const segLen = Math.floor(samples.length / SPECTROGRAM_ROWS);
      const segFftSize = Math.min(nextPow2(segLen || 1), 4096);
      const segFreqRes = wav.sampleRate / segFftSize;
      const segHalfBins = segFftSize / 2;

      for (let row = 0; row < SPECTROGRAM_ROWS; row++) {
        const segReal = new Float64Array(segFftSize);
        const segImag = new Float64Array(segFftSize);
        const startIdx = row * segLen;
        const endIdx = Math.min(startIdx + segLen, samples.length);
        const segCopyLen = Math.min(endIdx - startIdx, segFftSize);
        for (let i = 0; i < segCopyLen; i++) {
          const window = segCopyLen > 1 ? 0.5 * (1 - Math.cos((2 * Math.PI * i) / (segCopyLen - 1))) : 1;
          segReal[i] = samples[startIdx + i] * window;
        }
        fft(segReal, segImag);

        let line = '';
        for (let col = 0; col < SPECTROGRAM_COLS; col++) {
          // Map column to frequency bin (log-ish)
          const binIdx = Math.min(
            segHalfBins - 1,
            Math.floor(Math.pow(segHalfBins, col / SPECTROGRAM_COLS)),
          );
          const mag = Math.sqrt(segReal[binIdx] * segReal[binIdx] + segImag[binIdx] * segImag[binIdx]);
          const normalized = maxMag > 0 ? mag / maxMag : 0;
          const charIdx = Math.min(INTENSITY_CHARS.length - 1, Math.floor(normalized * INTENSITY_CHARS.length));
          line += INTENSITY_CHARS[charIdx];
        }
        const timeStart = ((row * segLen) / wav.sampleRate).toFixed(2);
        results.push(`${timeStart.padStart(6)}s ${line}`);
      }

      results.push('', `── 频谱图说明 ──`);
      results.push(`  频率范围: 0 - ${(wav.sampleRate / 2).toFixed(0)} Hz`);
      results.push(`  时间分辨率: ${((samples.length / SPECTROGRAM_ROWS) / wav.sampleRate).toFixed(3)} s/行`);
      results.push(`  频率分辨率: ${segFreqRes.toFixed(2)} Hz/bin`);
      results.push(`  强度字符: ${INTENSITY_CHARS} (弱→强)`);

      // Stego hints
      results.push('', '── 隐写信号提示 ──');
      const dtmfFreqs = [697, 770, 852, 941, 1209, 1336, 1477, 1633];
      for (const df of dtmfFreqs) {
        const bin = Math.round(df / freqResolution);
        if (bin < halfBins && mags[bin] > maxMag * 0.15) {
          results.push(`  ⚠ ${df} Hz 附近有能量峰值 — 可能是 DTMF 信号`);
        }
      }
      // Check for morse-like patterns (narrowband energy bursts)
      let burstCount = 0;
      for (let row = 0; row < SPECTROGRAM_ROWS; row++) {
        const segReal = new Float64Array(segFftSize);
        const segImag = new Float64Array(segFftSize);
        const startIdx = row * segLen;
        const endIdx = Math.min(startIdx + segLen, samples.length);
        const segCopyLen = Math.min(endIdx - startIdx, segFftSize);
        for (let i = 0; i < segCopyLen; i++) {
          segReal[i] = samples[startIdx + i];
        }
        fft(segReal, segImag);
        let rowMax = 0;
        for (let i = 0; i < segHalfBins; i++) {
          const m = Math.sqrt(segReal[i] * segReal[i] + segImag[i] * segImag[i]);
          if (m > rowMax) rowMax = m;
        }
        if (rowMax > maxMag * 0.05) burstCount++;
      }
      if (burstCount > SPECTROGRAM_ROWS * 0.3 && burstCount < SPECTROGRAM_ROWS * 0.7) {
        results.push('  ⚠ 检测到间歇性能量脉冲 — 可能是摩斯电码信号');
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
