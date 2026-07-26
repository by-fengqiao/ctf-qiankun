import AsyncTool from '../../_shared/AsyncTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      if (!file) {
        return '请拖入音频文件\n支持的格式: WAV, MP3, FLAC, OGG';
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      const lines = [
        `文件名: ${file.name}`,
        `文件大小: ${(file.size / 1024).toFixed(2)} KB`,
        `格式: ${ext.toUpperCase()}`,
        `MIME 类型: ${file.type}`,
        '',
      ];
      if (ext === 'wav' && input) {
        const hex = input.replace(/[^0-9a-fA-F]/g, '');
        if (hex.length >= 44) {
          const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((b: string) => parseInt(b, 16)) || []);
          const dv = new DataView(bytes.buffer);
          const isRiff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF';
          const isWave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WAVE';
          if (isRiff && isWave) {
            const channels = dv.getUint16(22, true);
            const sampleRate = dv.getUint32(24, true);
            const bitsPerSample = dv.getUint16(34, true);
            const dataSize = dv.getUint32(40, true);
            const duration = dataSize > 0 && channels > 0 && bitsPerSample > 0
              ? (dataSize / (sampleRate * channels * (bitsPerSample / 8))).toFixed(2)
              : '未知';
            lines.push('WAV 格式信息:', `  通道数: ${channels}`, `  采样率: ${sampleRate} Hz`, `  位深度: ${bitsPerSample} bits`, `  数据大小: ${(dataSize / 1024).toFixed(2)} KB`, `  时长: ${duration} 秒`);
          }
        }
      }
      lines.push('', '提示: 完整元数据提取（ID3 标签等）需要专用解码库。');
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
