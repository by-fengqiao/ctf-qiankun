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

// Morse code lookup table
const MORSE_TABLE: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
  '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
  '.-.-.-': '.', '--..--': ',', '..--..': '?', '.----.': "'",
  '-.-.--': '!', '-..-.': '/', '-.--.': '(', '-.--.-': ')',
  '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=',
  '.-.-.': '+', '-....-': '-', '..--.-': '_', '.-..-.': '"',
  '...-..-': '$', '.--.-.': '@',
};

const MAX_SAMPLES = 500000;
const BLOCK_SIZE = 256;

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="音频摩斯电码解码"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      let hex = input;
      if (file) hex = await readFileAsHex(file);
      if (!hex) return '请输入含摩斯电码的 WAV 十六进制数据或拖入文件';
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

      const maxSamples = Math.min(MAX_SAMPLES, Math.floor((bytes.length - wav.dataOffset) / (wav.bitsPerSample / 8 * wav.channels)));
      const samples = extractSamples(wav, maxSamples);

      const results: string[] = [
        '音频摩斯电码解码',
        `采样率: ${wav.sampleRate} Hz`,
        `位深度: ${wav.bitsPerSample} bit`,
        `采样数: ${samples.length}`,
        `时长: ${(samples.length / wav.sampleRate).toFixed(2)} s`,
        '',
      ];

      if (samples.length === 0) {
        results.push('⚠ 无音频数据');
        return results.join('\n');
      }

      // Compute amplitude envelope (RMS per block)
      const totalBlocks = Math.floor(samples.length / BLOCK_SIZE);
      const envelope: { time: number; rms: number }[] = [];
      let maxRms = 0;
      for (let b = 0; b < totalBlocks; b++) {
        let sumSq = 0;
        for (let i = 0; i < BLOCK_SIZE; i++) {
          const s = samples[b * BLOCK_SIZE + i];
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / BLOCK_SIZE);
        envelope.push({ time: (b * BLOCK_SIZE) / wav.sampleRate, rms });
        if (rms > maxRms) maxRms = rms;
      }

      if (maxRms === 0) {
        results.push('⚠ 音频静音，无信号');
        return results.join('\n');
      }

      // Adaptive threshold
      const threshold = maxRms * 0.25;

      // Detect on/off segments
      interface Segment {
        on: boolean;
        startBlock: number;
        endBlock: number;
        startTime: number;
        endTime: number;
        duration: number;
      }
      const segments: Segment[] = [];
      let currentOn = envelope[0].rms > threshold;
      let segStart = 0;

      for (let b = 1; b < envelope.length; b++) {
        const isOn = envelope[b].rms > threshold;
        if (isOn !== currentOn) {
          segments.push({
            on: currentOn,
            startBlock: segStart,
            endBlock: b,
            startTime: envelope[segStart].time,
            endTime: envelope[b].time,
            duration: envelope[b].time - envelope[segStart].time,
          });
          currentOn = isOn;
          segStart = b;
        }
      }
      if (segStart < envelope.length) {
        segments.push({
          on: currentOn,
          startBlock: segStart,
          endBlock: envelope.length,
          startTime: envelope[segStart].time,
          endTime: envelope[envelope.length - 1].time,
          duration: envelope[envelope.length - 1].time - envelope[segStart].time,
        });
      }

      // Filter out very short noise segments
      const minDuration = 0.01;
      const filteredSegments = segments.filter((s) => s.duration >= minDuration);

      results.push('── 信号检测 ──');
      results.push(`  最大 RMS: ${maxRms.toFixed(1)}`);
      results.push(`  阈值: ${threshold.toFixed(1)}`);
      results.push(`  信号段数: ${filteredSegments.length}`);
      results.push('');

      // Analyze on-segment durations to determine dot/dash
      const onSegments = filteredSegments.filter((s) => s.on);
      const offSegments = filteredSegments.filter((s) => !s.on);

      if (onSegments.length === 0) {
        results.push('⚠ 未检测到信号脉冲');
        return results.join('\n');
      }

      // Estimate unit duration (dot length)
      // Use median of on durations
      const onDurations = onSegments.map((s) => s.duration).sort((a, b) => a - b);
      const medianOn = onDurations[Math.floor(onDurations.length / 2)];

      // Cluster: short = dot, long = dash
      // Use a ratio-based approach: durations < 2x median = dot, > 2x = dash
      // But first, try to find a natural gap
      const sortedDurations = [...onDurations];
      // Find the largest ratio gap
      let bestGap = 0;
      let gapThreshold = medianOn * 1.5;
      for (let i = 1; i < sortedDurations.length; i++) {
        const ratio = sortedDurations[i] / sortedDurations[i - 1];
        if (ratio > bestGap && ratio > 1.5) {
          bestGap = ratio;
          gapThreshold = (sortedDurations[i] + sortedDurations[i - 1]) / 2;
        }
      }

      // Better: use k-means-like with 2 clusters
      let dotMean = sortedDurations[0];
      let dashMean = sortedDurations[sortedDurations.length - 1];
      for (let iter = 0; iter < 10; iter++) {
        let dotSum = 0;
        let dotCount = 0;
        let dashSum = 0;
        let dashCount = 0;
        for (const d of sortedDurations) {
          if (Math.abs(d - dotMean) < Math.abs(d - dashMean)) {
            dotSum += d;
            dotCount++;
          } else {
            dashSum += d;
            dashCount++;
          }
        }
        if (dotCount > 0) dotMean = dotSum / dotCount;
        if (dashCount > 0) dashMean = dashSum / dashCount;
      }
      const unitDuration = dotMean;
      gapThreshold = (dotMean + dashMean) / 2;

      results.push('── 时序分析 ──');
      results.push(`  点 (dot) 平均时长: ${(dotMean * 1000).toFixed(1)} ms`);
      results.push(`  划 (dash) 平均时长: ${(dashMean * 1000).toFixed(1)} ms`);
      results.push(`  单位时长: ${(unitDuration * 1000).toFixed(1)} ms`);
      results.push(`  分类阈值: ${(gapThreshold * 1000).toFixed(1)} ms`);
      results.push('');

      // Decode morse
      let morseStr = '';
      let currentChar = '';
      let decodedText = '';
      let lastWasOn = false;

      for (let i = 0; i < filteredSegments.length; i++) {
        const seg = filteredSegments[i];
        if (seg.on) {
          // Signal on → dot or dash
          if (seg.duration < gapThreshold) {
            currentChar += '.';
          } else {
            currentChar += '-';
          }
          lastWasOn = true;
        } else {
          // Signal off → gap
          if (lastWasOn) {
            // Check gap duration
            if (seg.duration > unitDuration * 2.5) {
              // Character gap or word gap
              if (currentChar) {
                const decoded = MORSE_TABLE[currentChar];
                if (decoded) {
                  decodedText += decoded;
                } else {
                  decodedText += `[${currentChar}]`;
                }
                morseStr += currentChar + '  ';
                currentChar = '';
              }
              if (seg.duration > unitDuration * 6) {
                // Word gap
                decodedText += ' ';
                morseStr += '/ ';
              }
            }
            // Intra-character gap: just continue
          }
          lastWasOn = false;
        }
      }
      // Handle last character
      if (currentChar) {
        const decoded = MORSE_TABLE[currentChar];
        if (decoded) {
          decodedText += decoded;
        } else {
          decodedText += `[${currentChar}]`;
        }
        morseStr += currentChar;
      }

      results.push('── 摩斯电码序列 ──');
      results.push(morseStr || '(无)');
      results.push('');
      results.push('── 解码文本 ──');
      results.push(decodedText || '(无)');

      // Raw timing dump
      results.push('', '── 原始时序 (前 50 段) ──');
      for (let i = 0; i < Math.min(50, filteredSegments.length); i++) {
        const seg = filteredSegments[i];
        const symbol = seg.on
          ? (seg.duration < gapThreshold ? '·(点)' : '━(划)')
          : (seg.duration > unitDuration * 2.5 ? '  [字符间隔]' : seg.duration > unitDuration * 6 ? '  [词间隔]' : '');
        results.push(
          `  ${seg.startTime.toFixed(3)}s  ${seg.on ? 'ON ' : 'OFF'}  ${(seg.duration * 1000).toFixed(1).padStart(7)}ms  ${symbol}`,
        );
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
