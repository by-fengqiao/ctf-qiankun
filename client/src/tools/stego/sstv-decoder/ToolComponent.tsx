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

/** Goertzel algorithm to detect power at a specific frequency. */
function goertzel(samples: number[], targetFreq: number, sampleRate: number): number {
  const n = samples.length;
  if (n === 0) return 0;
  const k = Math.round((n * targetFreq) / sampleRate);
  const w = (2 * Math.PI * k) / n;
  const cosW = Math.cos(w);
  const coeff = 2 * cosW;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

// SSTV VIS codes → mode mapping
const VIS_CODES: Record<number, { mode: string; resolution: string; color: string }> = {
  0x00: { mode: 'Robot 36', resolution: '320×240', color: '彩色 YUV' },
  0x04: { mode: 'Robot 36', resolution: '320×240', color: '彩色 YUV' },
  0x08: { mode: 'Robot 72', resolution: '320×240', color: '彩色 YUV' },
  0x0C: { mode: 'Scottie 1', resolution: '320×256', color: '彩色' },
  0x2C: { mode: 'Scottie 2', resolution: '320×256', color: '彩色' },
  0x3C: { mode: 'Scottie DX', resolution: '320×256', color: '彩色' },
  0x44: { mode: 'Martin 1', resolution: '320×256', color: '彩色' },
  0x48: { mode: 'Scottie 1', resolution: '320×256', color: '彩色' },
  0x58: { mode: 'Martin 2', resolution: '320×256', color: '彩色' },
  0x64: { mode: 'Scottie 2', resolution: '320×256', color: '彩色' },
  0x40: { mode: 'Martin 1', resolution: '320×256', color: '彩色' },
  0x60: { mode: 'Martin 2', resolution: '320×256', color: '彩色' },
  0x0E: { mode: 'PASOKON', resolution: '可变', color: '彩色' },
  0x18: { mode: 'PD 90', resolution: '160×120', color: '彩色' },
  0x1C: { mode: 'PD 90-2', resolution: '320×240', color: '彩色' },
  0x28: { mode: 'PD 120', resolution: '640×480', color: '彩色' },
  0x38: { mode: 'PD 160', resolution: '512×400', color: '彩色' },
  0x46: { mode: 'Scottie 1', resolution: '320×256', color: '彩色' },
  0x5C: { mode: 'PD 120', resolution: '640×480', color: '彩色' },
};

const SSTV_FREQS = {
  LEADER: 1900,
  BREAK: 1200,
  SYNC: 1200,
  VIS_START: 1100,
  VIS_BIT_1: 1100,
  VIS_BIT_0: 1300,
};

const SAMPLE_BLOCK_SIZE = 1024;

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="SSTV图像解码"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file?: File | null,
    ) => {
      let hex = input;
      if (file) hex = await readFileAsHex(file);
      if (!hex) return '请输入 SSTV 信号 WAV 的十六进制数据或拖入文件';
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

      const maxSamples = Math.min(200000, Math.floor((bytes.length - wav.dataOffset) / (wav.bitsPerSample / 8 * wav.channels)));
      const samples = extractSamples(wav, maxSamples);

      const results: string[] = [
        'SSTV 信号解码',
        `采样率: ${wav.sampleRate} Hz`,
        `声道数: ${wav.channels}`,
        `位深度: ${wav.bitsPerSample} bit`,
        `采样数: ${samples.length}`,
        `时长: ${(samples.length / wav.sampleRate).toFixed(2)} s`,
        '',
      ];

      // Scan frequency over time to detect leader tone and VIS code
      const totalBlocks = Math.floor(samples.length / SAMPLE_BLOCK_SIZE);
      const freqOverTime: { time: number; freq: number; power: number }[] = [];

      for (let b = 0; b < totalBlocks; b++) {
        const block = samples.slice(b * SAMPLE_BLOCK_SIZE, (b + 1) * SAMPLE_BLOCK_SIZE);
        // Measure dominant frequency via zero-crossing
        let zeroCrossings = 0;
        let prevSign = 0;
        for (const s of block) {
          const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
          if (sign !== 0 && prevSign !== 0 && sign !== prevSign) {
            zeroCrossings++;
          }
          if (sign !== 0) prevSign = sign;
        }
        const dominantFreq = (zeroCrossings * wav.sampleRate) / (2 * SAMPLE_BLOCK_SIZE);

        // Power at 1100 and 1300 Hz (VIS bits)
        const p1100 = goertzel(block, 1100, wav.sampleRate);
        const p1300 = goertzel(block, 1300, wav.sampleRate);
        const p1900 = goertzel(block, 1900, wav.sampleRate);
        const p1200 = goertzel(block, 1200, wav.sampleRate);

        const maxPower = Math.max(p1100, p1300, p1900, p1200);
        freqOverTime.push({
          time: (b * SAMPLE_BLOCK_SIZE) / wav.sampleRate,
          freq: dominantFreq,
          power: maxPower,
        });
      }

      // Detect 1900 Hz leader tone
      let leaderDetected = false;
      let leaderEndBlock = -1;
      for (let b = 0; b < totalBlocks; b++) {
        const block = samples.slice(b * SAMPLE_BLOCK_SIZE, (b + 1) * SAMPLE_BLOCK_SIZE);
        const p1900 = goertzel(block, 1900, wav.sampleRate);
        const p1200 = goertzel(block, 1200, wav.sampleRate);
        if (p1900 > p1200 * 3 && p1900 > 0) {
          leaderDetected = true;
        }
        if (leaderDetected && p1900 < p1200 * 3) {
          leaderEndBlock = b;
          break;
        }
      }

      results.push('── 信号检测 ──');
      results.push(`  1900 Hz 引导音: ${leaderDetected ? '✓ 检测到' : '✗ 未检测到'}`);
      if (leaderEndBlock >= 0) {
        results.push(`  引导音结束: ${freqOverTime[leaderEndBlock].time.toFixed(3)} s`);
      }

      // Detect 1200 Hz break / sync pulse
      let breakDetected = false;
      let breakBlock = -1;
      for (let b = (leaderEndBlock >= 0 ? leaderEndBlock : 0); b < totalBlocks; b++) {
        const block = samples.slice(b * SAMPLE_BLOCK_SIZE, (b + 1) * SAMPLE_BLOCK_SIZE);
        const p1200 = goertzel(block, 1200, wav.sampleRate);
        const p1100 = goertzel(block, 1100, wav.sampleRate);
        const p1900 = goertzel(block, 1900, wav.sampleRate);
        if (p1200 > p1100 * 2 && p1200 > p1900 * 2) {
          breakDetected = true;
          breakBlock = b;
          break;
        }
      }
      results.push(`  1200 Hz 同步脉冲: ${breakDetected ? '✓ 检测到' : '✗ 未检测到'}`);
      if (breakBlock >= 0) {
        results.push(`  同步脉冲位置: ${freqOverTime[breakBlock].time.toFixed(3)} s`);
      }

      // Detect VIS start (1100 Hz for 30ms)
      let visStartBlock = -1;
      const searchStart = breakBlock >= 0 ? breakBlock + 1 : (leaderEndBlock >= 0 ? leaderEndBlock : 0);
      for (let b = searchStart; b < totalBlocks; b++) {
        const block = samples.slice(b * SAMPLE_BLOCK_SIZE, (b + 1) * SAMPLE_BLOCK_SIZE);
        const p1100 = goertzel(block, 1100, wav.sampleRate);
        const p1200 = goertzel(block, 1200, wav.sampleRate);
        if (p1100 > p1200 * 2 && p1100 > 0) {
          visStartBlock = b;
          break;
        }
      }

      // Decode VIS code (8 bits, each ~30ms, 1100=1, 1300=0, even parity)
      let visCode = -1;
      let visBits: number[] = [];
      if (visStartBlock >= 0) {
        const bitsPerBlock = Math.round((0.030 * wav.sampleRate) / SAMPLE_BLOCK_SIZE);
        visBits = [];
        for (let bit = 0; bit < 8; bit++) {
          const bitStart = visStartBlock + 1 + bit * bitsPerBlock;
          if (bitStart >= totalBlocks) break;
          const block = samples.slice(
            bitStart * SAMPLE_BLOCK_SIZE,
            (bitStart + bitsPerBlock) * SAMPLE_BLOCK_SIZE,
          );
          const p1100 = goertzel(block, 1100, wav.sampleRate);
          const p1300 = goertzel(block, 1300, wav.sampleRate);
          visBits.push(p1100 > p1300 ? 1 : 0);
        }
        // LSB first
        let code = 0;
        for (let i = 0; i < Math.min(7, visBits.length); i++) {
          code |= visBits[i] << i;
        }
        visCode = code;
      }

      results.push('', '── VIS 码检测 ──');
      if (visStartBlock >= 0 && visBits.length > 0) {
        results.push(`  VIS 起始: ${freqOverTime[visStartBlock].time.toFixed(3)} s`);
        results.push(`  VIS 比特: ${visBits.join('')}`);
        results.push(`  VIS 码: 0x${visCode.toString(16).toUpperCase().padStart(2, '0')} (${visCode})`);
        const parity = visBits.slice(0, 7).reduce((a, b) => a + b, 0) % 2;
        results.push(`  奇偶校验: ${parity === visBits[7] ? '✓ 通过' : '⚠ 失败'}`);

        const modeInfo = VIS_CODES[visCode & 0xFF];
        if (modeInfo) {
          results.push('', '── SSTV 模式识别 ──');
          results.push(`  模式: ${modeInfo.mode}`);
          results.push(`  分辨率: ${modeInfo.resolution}`);
          results.push(`  颜色: ${modeInfo.color}`);
          const [w, h] = modeInfo.resolution.split('×').map((s) => parseInt(s, 10));
          if (w && h) {
            results.push(`  像素数: ${w * h}`);
            results.push(`  扫描线数: ${h}`);
          }
        } else {
          results.push('', '  ⚠ 未知 VIS 码，无法识别 SSTV 模式');
          results.push('  可能是非标准 SSTV 或解码错误');
        }
      } else {
        results.push('  ✗ 未检测到 VIS 码起始信号');
        results.push('  可能非 SSTV 信号或信号不完整');
      }

      // Extract sync pulses for scan line detection
      results.push('', '── 扫描线同步分析 ──');
      let syncCount = 0;
      const syncPositions: number[] = [];
      for (let b = 0; b < totalBlocks; b++) {
        const block = samples.slice(b * SAMPLE_BLOCK_SIZE, (b + 1) * SAMPLE_BLOCK_SIZE);
        const p1200 = goertzel(block, 1200, wav.sampleRate);
        if (p1200 > 0 && syncPositions.length === 0) continue;
        // Simplified: detect 1200Hz pulses after VIS
        if (visStartBlock >= 0 && b > visStartBlock + 10) {
          const p1100 = goertzel(block, 1100, wav.sampleRate);
          const p1300 = goertzel(block, 1300, wav.sampleRate);
          if (p1200 > p1100 * 1.5 && p1200 > p1300 * 1.5) {
            syncPositions.push(b);
            syncCount++;
          }
        }
      }
      results.push(`  检测到同步脉冲数: ${syncCount}`);
      if (syncPositions.length > 0) {
        results.push(`  首个同步脉冲: ${freqOverTime[Math.min(syncPositions[0], freqOverTime.length - 1)].time.toFixed(3)} s`);
        results.push(`  最后同步脉冲: ${freqOverTime[Math.min(syncPositions[syncPositions.length - 1], freqOverTime.length - 1)].time.toFixed(3)} s`);
      }

      results.push('', '── 解码说明 ──');
      results.push('  SSTV 使用 FM 调制，频率映射到亮度/色度');
      results.push('  典型频率: 1500 Hz=黑, 2300 Hz=白, 1200 Hz=同步');
      results.push('  完整像素数据解码需要更精确的 FM 解调器');
      if (visCode >= 0 && VIS_CODES[visCode & 0xFF]) {
        const mi = VIS_CODES[visCode & 0xFF];
        const [w, h] = mi.resolution.split('×').map((s) => parseInt(s, 10));
        results.push(`  预计图像: ${mi.resolution}, ${w * h} 像素`);
      }

      return results.join('\n');
    }}
  />
);

export default ToolComponent;
