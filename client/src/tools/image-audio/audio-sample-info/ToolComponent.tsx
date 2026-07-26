import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU16LE, readU32LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴音频文件的十六进制数据进行采样信息分析';
      if (!input) return '请输入 WAV 音频十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 WAV 音频十六进制数据';
      }
      if (bytes.length < 44) return '数据不足，WAV 文件至少需要 44 字节';
      const results: string[] = ['音频采样信息', `数据长度: ${bytes.length} 字节`, ''];
      const riff = bytesToText(bytes.slice(0, 4));
      const wave = bytesToText(bytes.slice(8, 12));
      if (riff !== 'RIFF' || wave !== 'WAVE') {
        results.push('⚠ 非标准 WAV 格式');
        results.push(`RIFF: ${riff}, WAVE: ${wave}`);
        return results.join('\n');
      }
      results.push('✓ 有效 WAV 格式');
      const fmtSize = readU32LE(bytes, 16);
      const audioFormat = readU16LE(bytes, 20);
      const channels = readU16LE(bytes, 22);
      const sampleRate = readU32LE(bytes, 24);
      const byteRate = readU32LE(bytes, 28);
      const blockAlign = readU16LE(bytes, 32);
      const bitsPerSample = readU16LE(bytes, 34);
      const formatNames: Record<number, string> = {
        1: 'PCM',
        2: 'ADPCM',
        3: 'IEEE Float',
        6: 'A-law',
        7: 'μ-law',
        17: 'ADPCM (IMA)',
        85: 'MP3',
      };
      results.push('', '── 基本信息 ──');
      results.push(`  音频格式: ${formatNames[audioFormat] ?? `未知 (${audioFormat})`}`);
      const channelDesc: Record<number, string> = { 1: '单声道 (Mono)', 2: '立体声 (Stereo)' };
      results.push(`  声道数: ${channels} (${channelDesc[channels] ?? '多声道'})`);
      results.push(`  采样率: ${sampleRate} Hz`);
      results.push(`  位深度: ${bitsPerSample} bit`);
      results.push(`  块对齐: ${blockAlign} 字节`);
      results.push(`  字节率: ${byteRate} B/s (${(byteRate / 1024).toFixed(2)} KB/s)`);
      const bitrate = sampleRate * channels * bitsPerSample;
      results.push(`  原始比特率: ${bitrate} bps (${(bitrate / 1000).toFixed(1)} kbps)`);
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
      if (dataSize > 0) {
        results.push('', '── 数据块信息 ──');
        results.push(`  数据大小: ${dataSize} 字节`);
        results.push(`  数据偏移: ${dataOffset + 8}`);
        if (channels > 0 && bitsPerSample > 0) {
          const samples = dataSize / (channels * (bitsPerSample / 8));
          const duration = dataSize / (channels * (bitsPerSample / 8) * sampleRate);
          results.push(`  总采样数: ${Math.floor(samples)}`);
          results.push(`  每声道采样: ${Math.floor(samples / channels)}`);
          const mins = Math.floor(duration / 60);
          const secs = (duration % 60).toFixed(2);
          results.push(`  预估时长: ${duration.toFixed(2)} 秒${mins > 0 ? ` (${mins}分${secs}秒)` : ''}`);
        }
      }
      results.push('', '── 质量评估 ──');
      if (sampleRate >= 44100) results.push('  采样率: CD 音质或更高');
      else if (sampleRate >= 22050) results.push('  采样率: 广播质量');
      else if (sampleRate >= 8000) results.push('  采样率: 电话质量');
      else results.push('  采样率: 低于标准');
      if (bitsPerSample >= 24) results.push('  位深度: 高保真');
      else if (bitsPerSample >= 16) results.push('  位深度: 标准质量');
      else results.push('  位深度: 低质量');
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
