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

// DTMF frequency table
const ROW_FREQS = [697, 770, 852, 941];
const COL_FREQS = [1209, 1336, 1477, 1633];
const ALL_FREQS = [...ROW_FREQS, ...COL_FREQS];

// DTMF digit lookup: [row][col]
const DTMF_TABLE: string[][] = [
  ['1', '2', '3', 'A'],
  ['4', '5', '6', 'B'],
  ['7', '8', '9', 'C'],
  ['*', '0', '#', 'D'],
];

/** Goertzel algorithm: returns power at targetFreq for the given samples. */
function goertzel(samples: number[], targetFreq: number, sampleRate: number): number {
  const n = samples.length;
  if (n === 0) return 0;
  const k = (n * targetFreq) / sampleRate;
  const w = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

const BLOCK_SIZE = 205; // ~40ms at 8000Hz, good for DTMF
const MAX_SAMPLES = 1000000;

interface DtmfHit {
  digit: string;
  startTime: number;
  endTime: number;
  rowFreq: number;
  colFreq: number;
  rowPower: number;
  colPower: number;
}

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="DTMF双音多频解码"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      let hex = input;
      if (file) hex = await readFileAsHex(file);
      if (!hex) return '请输入含 DTMF 信号的 WAV 十六进制数据或拖入文件';
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

      const maxSamples = Math.min(
        MAX_SAMPLES,
        Math.floor((bytes.length - wav.dataOffset) / (wav.bitsPerSample / 8 * wav.channels)),
      );
      const samples = extractSamples(wav, maxSamples);

      const results: string[] = [
        'DTMF 双音多频解码',
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

      // Use adaptive block size
      const blockLen = Math.min(BLOCK_SIZE, Math.floor(samples.length / 4));
      const totalBlocks = Math.floor(samples.length / blockLen);

      // Scan: compute Goertzel power for all 8 freqs per block
      interface BlockResult {
        time: number;
        powers: number[];
        rowIdx: number;
        colIdx: number;
        rowPower: number;
        colPower: number;
        totalPower: number;
      }
      const blockResults: BlockResult[] = [];

      let maxRowPower = 0;
      let maxColPower = 0;

      for (let b = 0; b < totalBlocks; b++) {
        const block = samples.slice(b * blockLen, (b + 1) * blockLen);
        const powers = ALL_FREQS.map((f) => goertzel(block, f, wav.sampleRate));

        // Find dominant row and column
        let rowIdx = 0;
        let colIdx = 0;
        let rowPower = powers[0];
        let colPower = powers[4];
        for (let r = 1; r < 4; r++) {
          if (powers[r] > rowPower) {
            rowPower = powers[r];
            rowIdx = r;
          }
        }
        for (let c = 5; c < 8; c++) {
          if (powers[c] > colPower) {
            colPower = powers[c];
            colIdx = c - 4;
          }
        }

        if (rowPower > maxRowPower) maxRowPower = rowPower;
        if (colPower > maxColPower) maxColPower = colPower;

        blockResults.push({
          time: (b * blockLen) / wav.sampleRate,
          powers,
          rowIdx,
          colIdx,
          rowPower,
          colPower,
          totalPower: rowPower + colPower,
        });
      }

      // Detect DTMF tones: both row and col power must exceed threshold
      // Threshold: adaptive based on max power
      const rowThreshold = maxRowPower * 0.15;
      const colThreshold = maxColPower * 0.15;

      // Minimum tone duration: ~40ms (DTMF spec min 40ms)
      const minToneBlocks = Math.max(1, Math.floor(0.04 / (blockLen / wav.sampleRate)));

      const hits: DtmfHit[] = [];
      let currentDigit: string | null = null;
      let digitStart = 0;
      let digitRowIdx = 0;
      let digitColIdx = 0;
      let digitRowPower = 0;
      let digitColPower = 0;
      let toneBlockCount = 0;

      for (let b = 0; b < blockResults.length; b++) {
        const br = blockResults[b];
        const isTone = br.rowPower > rowThreshold && br.colPower > colThreshold;

        if (isTone) {
          const digit = DTMF_TABLE[br.rowIdx][br.colIdx];
          if (currentDigit === digit) {
            toneBlockCount++;
            digitRowPower = Math.max(digitRowPower, br.rowPower);
            digitColPower = Math.max(digitColPower, br.colPower);
          } else if (currentDigit === null) {
            currentDigit = digit;
            digitStart = br.time;
            digitRowIdx = br.rowIdx;
            digitColIdx = br.colIdx;
            digitRowPower = br.rowPower;
            digitColPower = br.colPower;
            toneBlockCount = 1;
          } else {
            // New digit starts
            if (toneBlockCount >= minToneBlocks) {
              hits.push({
                digit: currentDigit,
                startTime: digitStart,
                endTime: blockResults[b - 1].time,
                rowFreq: ROW_FREQS[digitRowIdx],
                colFreq: COL_FREQS[digitColIdx],
                rowPower: digitRowPower,
                colPower: digitColPower,
              });
            }
            currentDigit = digit;
            digitStart = br.time;
            digitRowIdx = br.rowIdx;
            digitColIdx = br.colIdx;
            digitRowPower = br.rowPower;
            digitColPower = br.colPower;
            toneBlockCount = 1;
          }
        } else {
          // Gap
          if (currentDigit !== null && toneBlockCount >= minToneBlocks) {
            hits.push({
              digit: currentDigit,
              startTime: digitStart,
              endTime: blockResults[b - 1].time,
              rowFreq: ROW_FREQS[digitRowIdx],
              colFreq: COL_FREQS[digitColIdx],
              rowPower: digitRowPower,
              colPower: digitColPower,
            });
          }
          currentDigit = null;
          toneBlockCount = 0;
        }
      }
      // Handle last tone
      if (currentDigit !== null && toneBlockCount >= minToneBlocks) {
        hits.push({
          digit: currentDigit,
          startTime: digitStart,
          endTime: blockResults[blockResults.length - 1].time,
          rowFreq: ROW_FREQS[digitRowIdx],
          colFreq: COL_FREQS[digitColIdx],
          rowPower: digitRowPower,
          colPower: digitColPower,
        });
      }

      results.push('── 检测参数 ──');
      results.push(`  分析块大小: ${blockLen} 采样 (${((blockLen / wav.sampleRate) * 1000).toFixed(1)} ms)`);
      results.push(`  行频阈值: ${rowThreshold.toFixed(0)}`);
      results.push(`  列频阈值: ${colThreshold.toFixed(0)}`);
      results.push(`  最小音时长: ${minToneBlocks} 块 (${(minToneBlocks * blockLen / wav.sampleRate * 1000).toFixed(1)} ms)`);
      results.push('');

      results.push('── DTMF 频率表 ──');
      results.push('         1209 Hz   1336 Hz   1477 Hz   1633 Hz');
      for (let r = 0; r < 4; r++) {
        const row = DTMF_TABLE[r].map((d) => `  ${d}      `).join('');
        results.push(`  ${ROW_FREQS[r]} Hz |${row}`);
      }
      results.push('');

      results.push('── 解码结果 ──');
      if (hits.length === 0) {
        results.push('  ⚠ 未检测到 DTMF 信号');
        results.push('  请确认音频包含 DTMF 双音信号');
      } else {
        const digitSequence = hits.map((h) => h.digit).join('');
        results.push(`  检测到 ${hits.length} 个 DTMF 音`);
        results.push(`  解码序列: ${digitSequence}`);
        results.push('');
        results.push('── 详细时序 ──');
        results.push('  时间(s)    时长(ms)   按键   行频    列频    行能量    列能量');
        for (const h of hits) {
          const duration = (h.endTime - h.startTime) * 1000;
          results.push(
            `  ${h.startTime.toFixed(3).padStart(8)}  ${duration.toFixed(1).padStart(8)}   ${h.digit.padEnd(4)}  ${h.rowFreq} Hz  ${h.colFreq} Hz  ${h.rowPower.toFixed(0).padStart(8)}  ${h.colPower.toFixed(0).padStart(8)}`,
          );
        }
      }

      // Power spectrum visualization
      results.push('', '── 频率能量分布 (前 20 个分析块) ──');
      results.push('  时间     697    770    852    941   1209   1336   1477   1633');
      for (let b = 0; b < Math.min(20, blockResults.length); b++) {
        const br = blockResults[b];
        const bars = br.powers.map((p) => {
          const norm = Math.max(maxRowPower, maxColPower) > 0 ? p / Math.max(maxRowPower, maxColPower) : 0;
          return Math.round(norm * 99).toString().padStart(3);
        });
        results.push(`  ${br.time.toFixed(3).padStart(6)}  ${bars.join('  ')}`);
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
