import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): number[] => {
  const cleaned = hex.replace(/\s/g, '').toLowerCase();
  if (cleaned.length === 0) return [];
  if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
  const result: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.slice(i, i + 2), 16);
    if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${cleaned.slice(i, i + 2)}`);
    result.push(byte);
  }
  return result;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const positions: string[] = [];
      let count = 0;
      let inRun = false;
      let runStart = 0;
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0x00) {
          if (!inRun) {
            runStart = i;
            inRun = true;
          }
          count++;
        } else {
          if (inRun) {
            const runLen = i - runStart;
            positions.push(`0x${runStart.toString(16).padStart(4, '0')} (偏移 ${runStart}, 连续 ${runLen} 字节)`);
            inRun = false;
          }
        }
      }
      if (inRun) {
        const runLen = bytes.length - runStart;
        positions.push(`0x${runStart.toString(16).padStart(4, '0')} (偏移 ${runStart}, 连续 ${runLen} 字节)`);
      }
      if (positions.length === 0) return '未找到零字节 (0x00)';
      return `找到 ${count} 个零字节 (0x00)，分布在 ${positions.length} 个区域:\n\n${positions.join('\n')}\n\n零字节占比: ${(count / bytes.length * 100).toFixed(2)}%`;
    }}
  />
);
export default ToolComponent;
