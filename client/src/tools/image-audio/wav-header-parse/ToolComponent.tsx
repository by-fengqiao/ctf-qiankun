import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU16LE, readU32LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 WAV 文件的十六进制数据进行头部解析';
      if (!input) return '请输入 WAV 文件的十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 WAV 文件的十六进制数据';
      }
      if (bytes.length < 44) return '数据不足，WAV 头部至少需要 44 字节';
      const results: string[] = ['WAV 头部解析', `数据长度: ${bytes.length} 字节`, ''];
      const riff = bytesToText(bytes.slice(0, 4));
      const wave = bytesToText(bytes.slice(8, 12));
      if (riff !== 'RIFF') {
        results.push(`⚠ RIFF 标识符: "${riff}" (期望 "RIFF")`);
        return results.join('\n');
      }
      results.push(`✓ RIFF 标识符: ${riff}`);
      const fileSize = readU32LE(bytes, 4);
      results.push(`  文件大小: ${fileSize + 8} 字节 (头部声明)`);
      if (wave !== 'WAVE') {
        results.push(`⚠ WAVE 标识符: "${wave}" (期望 "WAVE")`);
        return results.join('\n');
      }
      results.push(`✓ WAVE 标识符: ${wave}`);
      const fmtId = bytesToText(bytes.slice(12, 16));
      if (fmtId === 'fmt ') {
        const fmtSize = readU32LE(bytes, 16);
        const audioFormat = readU16LE(bytes, 20);
        const channels = readU16LE(bytes, 22);
        const sampleRate = readU32LE(bytes, 24);
        const byteRate = readU32LE(bytes, 28);
        const blockAlign = readU16LE(bytes, 32);
        const bitsPerSample = readU16LE(bytes, 34);
        results.push('', '── fmt 块 ──');
        results.push(`  fmt 大小: ${fmtSize} 字节`);
        const formatNames: Record<number, string> = {
          1: 'PCM (脉冲编码调制)',
          2: 'ADPCM',
          3: 'IEEE Float',
          6: 'A-law',
          7: 'μ-law',
          17: 'ADPCM',
          85: 'MP3',
        };
        results.push(`  音频格式: ${audioFormat} (${formatNames[audioFormat] ?? '未知'})`);
        const channelNames: Record<number, string> = { 1: '单声道', 2: '立体声' };
        results.push(`  声道数: ${channels} (${channelNames[channels] ?? '多声道'})`);
        results.push(`  采样率: ${sampleRate} Hz`);
        results.push(`  字节率: ${byteRate} B/s (${(byteRate / 1024).toFixed(2)} KB/s)`);
        results.push(`  块对齐: ${blockAlign} 字节`);
        results.push(`  位深度: ${bitsPerSample} bit`);
        let dataOffset = 20 + fmtSize;
        if (dataOffset % 2 !== 0) dataOffset += 1;
        while (dataOffset + 8 <= bytes.length) {
          const chunkId = bytesToText(bytes.slice(dataOffset, dataOffset + 4));
          const chunkSize = readU32LE(bytes, dataOffset + 4);
          if (chunkId === 'data') {
            results.push('', '── data 块 ──');
            results.push(`  偏移: ${dataOffset}`);
            results.push(`  数据大小: ${chunkSize} 字节`);
            if (channels > 0 && bitsPerSample > 0 && sampleRate > 0) {
              const duration = chunkSize / (channels * (bitsPerSample / 8) * sampleRate);
              results.push(`  预估时长: ${duration.toFixed(2)} 秒`);
            }
            break;
          }
          results.push(`  [${chunkId}] 块, 大小: ${chunkSize} 字节, 偏移: ${dataOffset}`);
          dataOffset += 8 + chunkSize;
          if (dataOffset % 2 !== 0) dataOffset += 1;
        }
      }
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
