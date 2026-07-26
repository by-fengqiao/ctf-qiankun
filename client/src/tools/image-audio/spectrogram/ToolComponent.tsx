import AsyncTool from '../../_shared/AsyncTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      if (file) {
        return [
          `文件名: ${file.name}`,
          `文件大小: ${(file.size / 1024).toFixed(2)} KB`,
          '',
          '频谱分析:',
          '  (需要 FFT 库进行完整频谱分析)',
          '',
          '基础分析:',
          `  文件类型: ${file.type || '未知'}`,
          `  文件大小: ${file.size} bytes`,
        ].join('\n');
      }
      if (input) {
        const hex = input.replace(/[^0-9a-fA-F]/g, '');
        if (hex.length >= 44) {
          const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((b: string) => parseInt(b, 16)) || []);
          if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF') {
            const dv = new DataView(bytes.buffer);
            const channels = dv.getUint16(22, true);
            const sampleRate = dv.getUint32(24, true);
            const bitsPerSample = dv.getUint16(34, true);
            return [
              'WAV 文件频谱信息:',
              `  采样率: ${sampleRate} Hz`,
              `  通道数: ${channels}`,
              `  位深度: ${bitsPerSample} bits`,
              `  奈奎斯特频率: ${sampleRate / 2} Hz`,
              `  频率分辨率: ${(sampleRate / 1024).toFixed(2)} Hz (1024点FFT)`,
              '',
              '提示: 完整频谱图需要 FFT 库支持',
            ].join('\n');
          }
        }
      }
      return '请拖入音频文件或输入音频十六进制数据进行频谱分析';
    }}
  />
);
export default ToolComponent;
