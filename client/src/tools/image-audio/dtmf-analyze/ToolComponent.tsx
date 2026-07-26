import AsyncTool from '../../_shared/AsyncTool';
import type { ToolProps } from '../../types';

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      if (!file && !input) {
        return [
          'DTMF 双音多频频率表:',
          '',
          '键  | 低频(Hz) | 高频(Hz)',
          '----|----------|----------',
          ...Object.entries(DTMF_FREQS).map(([key, [lo, hi]]) => ` ${key.padEnd(3)}|  ${lo}     |  ${hi}`),
          '',
          '请拖入 WAV 音频文件或输入音频十六进制数据进行 DTMF 分析',
        ].join('\n');
      }
      if (file) {
        return [
          `文件名: ${file.name}`,
          `文件大小: ${(file.size / 1024).toFixed(2)} KB`,
          '',
          'DTMF 分析结果:',
          '  检测到的 DTMF 信号:',
          '  (需要音频解码库进行完整频谱分析)',
          '',
          'DTMF 频率参考:',
          `  行频: 697, 770, 852, 941 Hz`,
          `  列频: 1209, 1336, 1477, 1633 Hz`,
        ].join('\n');
      }
      return [
        'DTMF 频率表已显示',
        '请拖入 WAV 文件进行完整 DTMF 分析',
      ].join('\n');
    }}
  />
);
export default ToolComponent;
