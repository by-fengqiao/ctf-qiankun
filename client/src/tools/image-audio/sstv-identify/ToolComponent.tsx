import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU32LE, readU16LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const VIS_CODES: Record<number, string> = {
  0x20: 'Robot 24',
  0x28: 'Robot 24 (alt)',
  0x2C: 'Robot 36',
  0x3C: 'Robot 72',
  0x40: 'Martin 1',
  0x44: 'Martin 2',
  0x48: 'Martin 1 (alt)',
  0x4D: 'PD160',
  0x5C: 'Scottie 1',
  0x60: 'Scottie S1',
  0x63: 'Scottie 2',
  0x67: 'Scottie DX',
  0x68: 'PD90',
  0x69: 'PD120',
  0x6E: 'PD240',
  0x7C: 'Wraase SC2-180',
  0x82: 'PD290',
  0x8E: 'PD120 (alt)',
  0x91: 'PD180',
  0xA0: 'P3',
  0xB0: 'P5',
  0xC0: 'P7',
  0xCC: 'Scottie DX (alt)',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 WAV 音频文件的十六进制数据进行 SSTV 识别';
      if (!input) return '请输入 WAV 音频十六进制数据或 VIS 码';
      const trimmed = input.trim();
      const visNum = parseInt(trimmed, 10);
      if (!isNaN(visNum) && visNum >= 0 && visNum <= 255 && trimmed.length <= 3) {
        const modeName = VIS_CODES[visNum];
        if (modeName) {
          return [
            'SSTV VIS 码识别',
            '',
            `VIS 码: ${visNum} (0x${visNum.toString(16).toUpperCase().padStart(2, '0')})`,
            `SSTV 模式: ${modeName}`,
            '',
            '提示: VIS 码用于标识 SSTV 传输的图像模式',
          ].join('\n');
        }
        return `VIS 码 ${visNum} 未在已知模式列表中，可能是自定义模式`;
      }
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 WAV 音频十六进制数据或 VIS 码';
      }
      if (bytes.length < 12) return '数据不足';
      const results: string[] = ['SSTV 模式识别', `数据长度: ${bytes.length} 字节`, ''];
      const riff = bytesToText(bytes.slice(0, 4));
      if (riff === 'RIFF') {
        const wave = bytesToText(bytes.slice(8, 12));
        if (wave !== 'WAVE') {
          results.push('⚠ 非 WAV 格式');
          return results.join('\n');
        }
        const sampleRate = readU32LE(bytes, 24);
        const channels = readU16LE(bytes, 22);
        const bitsPerSample = readU16LE(bytes, 34);
        results.push('✓ WAV 格式检测');
        results.push(`  采样率: ${sampleRate} Hz`);
        results.push(`  声道: ${channels}`);
        results.push(`  位深: ${bitsPerSample} bit`);
        results.push('', '── VIS 码扫描 ──');
        const fmtSize = readU32LE(bytes, 16);
        let dataOffset = 20 + fmtSize;
        if (dataOffset % 2 !== 0) dataOffset += 1;
        let dataSize = 0;
        while (dataOffset + 8 <= bytes.length) {
          const chunkId = bytesToText(bytes.slice(dataOffset, dataOffset + 4));
          const chunkSize = readU32LE(bytes, dataOffset + 4);
          if (chunkId === 'data') {
            dataSize = chunkSize;
            break;
          }
          dataOffset += 8 + chunkSize;
          if (dataOffset % 2 !== 0) dataOffset += 1;
        }
        if (dataSize === 0) {
          results.push('⚠ 未找到 data 块');
          return results.join('\n');
        }
        const dataStart = dataOffset + 8;
        const bytesPerSample = bitsPerSample / 8;
        const frameSize = bytesPerSample * channels;
        const maxSamples = Math.min(
          Math.floor(dataSize / frameSize),
          Math.floor((bytes.length - dataStart) / frameSize),
        );
        const samples: number[] = [];
        for (let i = 0; i < maxSamples && samples.length < sampleRate * 2; i++) {
          const offset = dataStart + i * frameSize;
          let sample = 0;
          for (let b = 0; b < bytesPerSample; b++) {
            sample |= bytes[offset + b] << (b * 8);
          }
          if (bitsPerSample === 16) {
            if (sample > 32767) sample -= 65536;
            samples.push(sample);
          } else {
            samples.push(sample);
          }
        }
        const targetFreqs = [1100, 1200, 1300, 1900];
        const threshold = sampleRate / targetFreqs[0] * 2;
        const crossings: number[] = [];
        let prevSign = samples[0] >= 0;
        for (let i = 1; i < samples.length; i++) {
          const sign = samples[i] >= 0;
          if (sign !== prevSign) {
            crossings.push(i);
            prevSign = sign;
          }
        }
        const freqs: number[] = [];
        for (let i = 1; i < crossings.length; i++) {
          const period = crossings[i] - crossings[i - 1];
          if (period > 0) freqs.push(sampleRate / (period * 2));
        }
        const leaderTone = freqs.filter((f: number) => Math.abs(f - 1900) < 100).length;
        const startBit = freqs.filter((f: number) => Math.abs(f - 1100) < 100).length;
        const oneBits = freqs.filter((f: number) => Math.abs(f - 1300) < 100).length;
        const zeroBits = freqs.filter((f: number) => Math.abs(f - 1100) < 100).length;
        results.push(`  分析采样数: ${samples.length}`);
        results.push(`  频率过零点: ${crossings.length}`);
        results.push(`  1900Hz 帧率: ${leaderTone} (引导音)`);
        results.push(`  1100Hz 帧率: ${startBit + zeroBits} (起始位/0位)`);
        results.push(`  1300Hz 帧率: ${oneBits} (1位)`);
        if (leaderTone > threshold || oneBits > 0) {
          results.push('', '✓ 检测到 SSTV 信号特征');
          results.push('  存在 SSTV 典型频率成分');
          for (const [code, name] of Object.entries(VIS_CODES)) {
            results.push(`  可能模式: ${name} (VIS 0x${parseInt(code).toString(16).toUpperCase().padStart(2, '0')})`);
            if (results.length > 30) break;
          }
        } else {
          results.push('', '⚠ 未检测到明显 SSTV 信号特征');
          results.push('  可能原因: 非音频文件、SSTV 编码方式不同、数据不足');
        }
      } else {
        results.push('⚠ 非 WAV 格式，尝试直接搜索 VIS 码');
        for (let i = 0; i < bytes.length; i++) {
          if (VIS_CODES[bytes[i]]) {
            results.push(`  偏移 ${i}: VIS 0x${bytes[i].toString(16).toUpperCase().padStart(2, '0')} → ${VIS_CODES[bytes[i]]}`);
          }
        }
      }
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
