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
      const parts = input.split('\n---\n');
      if (parts.length < 2) {
        throw new Error('请用 \\n---\\n 分隔两个 Hex 输入');
      }
      const bytesA = hexToBytes(parts[0]);
      const bytesB = hexToBytes(parts[1]);
      const maxLen = Math.max(bytesA.length, bytesB.length);
      const minLen = Math.min(bytesA.length, bytesB.length);
      const lines: string[] = [
        `文件 A: ${bytesA.length} bytes`,
        `文件 B: ${bytesB.length} bytes`,
        `大小差异: ${Math.abs(bytesA.length - bytesB.length)} bytes`,
        '',
      ];
      const diffs: string[] = [];
      let diffCount = 0;
      for (let i = 0; i < maxLen; i++) {
        const a = i < bytesA.length ? bytesA[i] : null;
        const b = i < bytesB.length ? bytesB[i] : null;
        if (a !== b) {
          diffCount++;
          const aHex = a !== null ? a.toString(16).padStart(2, '0') : '--';
          const bHex = b !== null ? b.toString(16).padStart(2, '0') : '--';
          diffs.push(`0x${i.toString(16).padStart(4, '0')} (偏移 ${i}): ${aHex} → ${bHex}`);
        }
      }
      lines.push(`不同字节数: ${diffCount}`);
      lines.push(`相同字节数: ${minLen - (diffCount - Math.abs(bytesA.length - bytesB.length))}`);
      if (diffs.length > 0) {
        lines.push('');
        lines.push('差异明细:');
        const showCount = Math.min(diffs.length, 50);
        lines.push(...diffs.slice(0, showCount));
        if (diffs.length > showCount) {
          lines.push(`... (还有 ${diffs.length - showCount} 处差异)`);
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
