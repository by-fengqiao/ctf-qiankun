import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入音频十六进制数据进行频谱分析';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入音频十六进制数据进行频谱分析';
      }
      if (bytes.length < 4) return '数据不足，至少需要 4 字节';
      const freq = new Array(256).fill(0);
      for (const b of bytes) {
        freq[b]++;
      }
      const total = bytes.length;
      let maxFreq = 0;
      let maxByte = 0;
      for (let i = 0; i < 256; i++) {
        if (freq[i] > maxFreq) {
          maxFreq = freq[i];
          maxByte = i;
        }
      }
      let entropy = 0;
      for (const f of freq) {
        if (f > 0) {
          const p = f / total;
          entropy -= p * Math.log2(p);
        }
      }
      const ranges = [
        { name: '0x00-0x1F', min: 0, max: 32 },
        { name: '0x20-0x3F', min: 32, max: 64 },
        { name: '0x40-0x5F', min: 64, max: 96 },
        { name: '0x60-0x7F', min: 96, max: 128 },
        { name: '0x80-0x9F', min: 128, max: 160 },
        { name: '0xA0-0xBF', min: 160, max: 192 },
        { name: '0xC0-0xDF', min: 192, max: 224 },
        { name: '0xE0-0xFF', min: 224, max: 256 },
      ];
      return [
        '频谱信息分析',
        `数据字节数: ${total}`,
        `信息熵: ${entropy.toFixed(4)} bits/byte`,
        `最频繁字节: 0x${maxByte.toString(16).padStart(2, '0').toUpperCase()} (${maxFreq} 次, ${((maxFreq / total) * 100).toFixed(1)}%)`,
        '',
        '── 字节频率分布 ──',
        ...ranges.map((r) => {
          const count = freq.slice(r.min, r.max).reduce((a, b) => a + b, 0);
          const bar = '█'.repeat(Math.round((count / total) * 40));
          return `  ${r.name}: ${count.toString().padStart(6)} ${bar}`;
        }),
        '',
        '── 前 5 高频字节 ──',
        ...freq
          .map((f, i) => ({ byte: i, count: f }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((e) => `  0x${e.byte.toString(16).padStart(2, '0').toUpperCase()}: ${e.count} 次`),
        '',
        '提示: 高信息熵（接近 8.0）表示数据可能是压缩/加密的',
      ].join('\n');
    }}
  />
);
export default ToolComponent;
