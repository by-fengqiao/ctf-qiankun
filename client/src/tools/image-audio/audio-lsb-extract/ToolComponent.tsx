import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU32LE, readU16LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const findDataChunk = (bytes: Uint8Array): { offset: number; size: number } | null => {
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const chunkSize = readU32LE(bytes, offset + 4);
    if (chunkId === 'data') {
      return { offset: offset + 8, size: chunkSize };
    }
    offset += 8 + chunkSize;
    if (offset % 2 !== 0) offset += 1;
  }
  return null;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'bitCount', label: '提取位数', type: 'text', placeholder: '1-8', default: '1' },
      { name: 'channel', label: '声道', type: 'select', default: '0', options: [
        { value: '0', label: '声道 0 (左)' },
        { value: '1', label: '声道 1 (右)' },
      ] },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 WAV 文件的十六进制数据进行 LSB 提取';
      if (!input) return '请输入 WAV 音频十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 WAV 音频十六进制数据';
      }
      if (bytes.length < 44) return '数据不足，WAV 文件至少需要 44 字节';
      const bitCount = Math.max(1, Math.min(8, parseInt((params.bitCount as string) || '1', 10)));
      const channel = parseInt((params.channel as string) || '0', 10);
      const results: string[] = ['音频 LSB 隐写提取', `数据长度: ${bytes.length} 字节`, ''];
      const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
      if (riff !== 'RIFF') {
        results.push('⚠ 非 RIFF 格式，尝试直接从数据中提取 LSB');
        const extractedBits: number[] = [];
        for (let i = 0; i < bytes.length; i++) {
          for (let b = 0; b < bitCount; b++) {
            extractedBits.push((bytes[i] >> b) & 1);
          }
        }
        const bitStr = extractedBits.join('');
        const byteArr: number[] = [];
        for (let i = 0; i + 8 <= bitStr.length; i += 8) {
          byteArr.push(parseInt(bitStr.substring(i, i + 8), 2));
        }
        results.push(`提取位数: ${bitCount}`);
        results.push(`提取比特数: ${extractedBits.length}`);
        results.push(`提取字节数: ${byteArr.length}`);
        results.push('', '── 提取结果 ──');
        results.push(bytesToText(new Uint8Array(byteArr)));
        return results.join('\n');
      }
      const fmtSize = readU32LE(bytes, 16);
      const audioFormat = readU16LE(bytes, 20);
      const channels = readU16LE(bytes, 22);
      const bitsPerSample = readU16LE(bytes, 34);
      results.push(`音频格式: ${audioFormat === 1 ? 'PCM' : audioFormat}`);
      results.push(`声道数: ${channels}`);
      results.push(`位深度: ${bitsPerSample}`);
      results.push(`提取位数: ${bitCount} LSB`);
      results.push(`目标声道: ${channel}`);
      const dataChunk = findDataChunk(bytes);
      if (!dataChunk) {
        results.push('', '⚠ 未找到 data 块');
        return results.join('\n');
      }
      results.push(`数据偏移: ${dataChunk.offset}`);
      results.push(`数据大小: ${dataChunk.size} 字节`);
      const bytesPerSample = bitsPerSample / 8;
      const frameSize = bytesPerSample * channels;
      if (channel >= channels) {
        results.push(`⚠ 声道 ${channel} 不存在（共 ${channels} 个声道）`);
        return results.join('\n');
      }
      const extractedBits: number[] = [];
      const maxSamples = Math.min(
        Math.floor(dataChunk.size / frameSize),
        Math.floor((bytes.length - dataChunk.offset) / frameSize),
      );
      for (let i = 0; i < maxSamples; i++) {
        const sampleOffset = dataChunk.offset + i * frameSize + channel * bytesPerSample;
        let sample = 0;
        for (let b = 0; b < bytesPerSample; b++) {
          sample |= bytes[sampleOffset + b] << (b * 8);
        }
        for (let b = 0; b < bitCount; b++) {
          extractedBits.push((sample >> b) & 1);
        }
      }
      const bitStr = extractedBits.join('');
      const byteArr: number[] = [];
      for (let i = 0; i + 8 <= bitStr.length; i += 8) {
        byteArr.push(parseInt(bitStr.substring(i, i + 8), 2));
      }
      results.push(`采样数: ${maxSamples}`);
      results.push(`提取比特数: ${extractedBits.length}`);
      results.push(`提取字节数: ${byteArr.length}`);
      results.push('', '── 提取结果 ──');
      const text = bytesToText(new Uint8Array(byteArr));
      results.push(text || '(无可打印文本)');
      results.push('', '── 十六进制 ──');
      results.push(Array.from(byteArr.slice(0, 256)).map((b: number) => b.toString(16).padStart(2, '0')).join(' '));
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
