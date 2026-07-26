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
    paramsConfig={[
      {
        name: 'minLen',
        label: '最小重复长度',
        type: 'select',
        default: '2',
        options: [
          { value: '2', label: '2 bytes' },
          { value: '3', label: '3 bytes' },
          { value: '4', label: '4 bytes' },
          { value: '5', label: '5 bytes' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const minLen = parseInt((params.minLen as string) ?? '2', 10) || 2;
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const found = new Map<string, { count: number; positions: number[] }>();
      for (let len = minLen; len <= Math.min(8, bytes.length); len++) {
        for (let i = 0; i <= bytes.length - len; i++) {
          const seq = bytes.slice(i, i + len);
          const key = seq.map((b: number) => b.toString(16).padStart(2, '0')).join(' ');
          if (!found.has(key)) {
            let count = 0;
            const positions: number[] = [];
            for (let j = 0; j <= bytes.length - len; j++) {
              let match = true;
              for (let k = 0; k < len; k++) {
                if (bytes[j + k] !== seq[k]) { match = false; break; }
              }
              if (match) {
                count++;
                positions.push(j);
              }
            }
            if (count >= 2) {
              found.set(key, { count, positions });
            }
          }
        }
      }
      const entries = Array.from(found.entries())
        .filter(([_k, v]) => v.count >= 2)
        .sort((a, b) => {
          const keyA = a[0].split(' ').length;
          const keyB = b[0].split(' ').length;
          if (keyB !== keyA) return keyB - keyA;
          return b[1].count - a[1].count;
        })
        .slice(0, 20);
      if (entries.length === 0) return '未找到重复字节序列';
      const lines = entries.map(([seq, info]) => {
        const posStr = info.positions.map((p: number) => `0x${p.toString(16).padStart(4, '0')}`).join(', ');
        return `${seq}  —  出现 ${info.count} 次 @ [${posStr}]`;
      });
      return `找到 ${entries.length} 个重复序列 (显示前 20):\n\n${lines.join('\n')}`;
    }}
  />
);
export default ToolComponent;
