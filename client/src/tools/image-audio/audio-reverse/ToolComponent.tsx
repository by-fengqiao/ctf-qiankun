import AsyncTool from '../../_shared/AsyncTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      if (!file && !input) {
        return '请拖入 WAV 音频文件进行音频反转\n反转后的音频将倒序播放';
      }
      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'RIFF') {
            return `文件: ${file.name}\n格式不支持，仅支持 WAV 格式`;
          }
          // 解析 RIFF chunk 结构
          let bytesPerSample = 2;
          let numChannels = 2;
          let dataOffset = -1;
          let dataSize = 0;
          let offset = 12; // 跳过 RIFF header (4 + 4 + 4)
          while (offset + 8 <= bytes.length) {
            const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
            const chunkSize = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
            if (chunkId === 'fmt ') {
              numChannels = bytes[offset + 10] | (bytes[offset + 11] << 8);
              bytesPerSample = (bytes[offset + 22] | (bytes[offset + 23] << 8)) / 8; // bitsPerSample / 8
            } else if (chunkId === 'data') {
              dataOffset = offset + 8;
              dataSize = chunkSize;
              break;
            }
            offset += 8 + chunkSize + (chunkSize % 2); // chunks are word-aligned
          }
          if (dataOffset < 0 || dataSize <= 0) return 'WAV 文件中未找到 data chunk';
          const frameSize = bytesPerSample * numChannels;
          const numFrames = Math.floor(dataSize / frameSize);
          if (numFrames <= 0) return 'WAV 文件数据为空';
          // 按帧反转数据部分
          const reversed = new Uint8Array(bytes.length);
          reversed.set(bytes.subarray(0, dataOffset)); // 保留头部
          for (let i = 0; i < numFrames; i++) {
            const srcStart = dataOffset + (numFrames - 1 - i) * frameSize;
            const dstStart = dataOffset + i * frameSize;
            for (let j = 0; j < frameSize; j++) {
              reversed[dstStart + j] = bytes[srcStart + j];
            }
          }
          // 复制 data chunk 之后可能存在的剩余数据
          const dataEnd = dataOffset + dataSize;
          if (dataEnd < bytes.length) {
            reversed.set(bytes.subarray(dataEnd), dataEnd);
          }
          const reversedHex = Array.from(reversed.subarray(0, 200))
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('');
          return [
            `文件名: ${file.name}`,
            `原始大小: ${(file.size / 1024).toFixed(2)} KB`,
            `数据偏移: ${dataOffset}`,
            `数据大小: ${dataSize} bytes`,
            `声道数: ${numChannels}, 每样本字节: ${bytesPerSample}, 帧大小: ${frameSize}`,
            `总帧数: ${numFrames}`,
            '',
            '音频已按帧反转 (前200字节 Hex):',
            reversedHex + '...',
            '',
            '提示: 反转后的音频数据可保存为 WAV 文件播放',
          ].join('\n');
        } catch (e) {
          throw new Error(`音频反转失败: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      return '请拖入 WAV 文件进行反转';
    }}
  />
);
export default ToolComponent;
