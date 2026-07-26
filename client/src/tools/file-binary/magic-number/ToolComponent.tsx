import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (input: string): Uint8Array => {
  const cleaned = input.replace(/[\s:,-]/g, '').replace(/0x/gi, '').toLowerCase();
  if (cleaned.length === 0) return new Uint8Array(0);
  if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
  if (!/^[0-9a-f]+$/.test(cleaned)) throw new Error('包含非十六进制字符');
  const result = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    result[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return result;
};

const MAGIC_SIGNATURES: { hex: string; name: string }[] = [
  { hex: '89504e47', name: 'PNG' },
  { hex: 'ffd8ff', name: 'JPEG' },
  { hex: '47494638', name: 'GIF' },
  { hex: '25504446', name: 'PDF' },
  { hex: '504b0304', name: 'ZIP' },
  { hex: '1f8b', name: 'GZIP' },
  { hex: '424d', name: 'BMP' },
  { hex: '4f676753', name: 'OGG' },
  { hex: '664c6143', name: 'FLAC' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'byteCount',
        label: '字节数',
        type: 'text',
        default: '32',
        placeholder: '16',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const count = Math.min(parseInt((params.byteCount as string) ?? '32', 10) || 32, 256);
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const slice = bytes.slice(0, count);
      const hex = Array.from(slice)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join(' ');
      const ascii = Array.from(slice)
        .map((b: number) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
      const continuous = hex.replace(/\s/g, '');
      let matchedName: string | null = null;
      for (const sig of MAGIC_SIGNATURES) {
        if (continuous.startsWith(sig.hex.toLowerCase())) {
          matchedName = sig.name;
          break;
        }
      }
      const lines = [
        `=== 前 ${slice.length} 字节魔数 ===`,
        `Hex:   ${hex}`,
        `ASCII: ${ascii}`,
        `连续:  ${continuous}`,
      ];
      if (matchedName) {
        lines.push('', `✓ 匹配文件格式: ${matchedName}`);
      } else {
        lines.push('', '✗ 未匹配到已知文件格式');
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
