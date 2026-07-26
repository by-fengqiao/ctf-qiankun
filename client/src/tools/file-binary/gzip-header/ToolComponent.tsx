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

const CM_NAMES: Record<number, string> = {
  0: 'Stored',
  1: 'Compression Method 1',
  2: 'Compression Method 2',
  3: 'Compression Method 3',
  4: 'Compression Method 4',
  8: 'Deflate',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 10) throw new Error('GZIP 头至少需要 10 字节');
      if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
        return '⚠️ 不是有效的 GZIP 文件（签名 1F8B 不匹配）';
      }
      const cm = bytes[2];
      const flg = bytes[3];
      const mtime =
        (bytes[4]) |
        (bytes[5] << 8) |
        (bytes[6] << 16) |
        (bytes[7] << 24);
      const xfl = bytes[8];
      const os = bytes[9];
      const osNames: Record<number, string> = {
        0: 'FAT/MS-DOS',
        3: 'Unix',
        7: 'Mac OS',
        11: 'NTFS',
        255: 'Unknown',
      };
      const lines: string[] = [
        '✓ GZIP 签名验证通过',
        '',
        `魔数: 1f 8b`,
        `压缩方法: ${cm} (${CM_NAMES[cm] ?? 'Unknown'})`,
        `标志: 0x${flg.toString(16).padStart(2, '0')} (二进制: ${flg.toString(2).padStart(8, '0')})`,
      ];
      const flags: string[] = [];
      if (flg & 0x01) flags.push('FTEXT (文本)');
      if (flg & 0x02) flags.push('FHCRC (CRC16)');
      if (flg & 0x04) flags.push('FEXTRA (额外字段)');
      if (flg & 0x08) flags.push('FNAME (文件名)');
      if (flg & 0x10) flags.push('FCOMMENT (注释)');
      lines.push(`  标志位: ${flags.length > 0 ? flags.join(', ') : '无'}`);
      const mtimeDate = mtime > 0 ? new Date(mtime * 1000).toISOString() : '未设置';
      lines.push(`修改时间: ${mtimeDate} (timestamp: ${mtime})`);
      lines.push(`额外标志: ${xfl}`);
      lines.push(`操作系统: ${os} (${osNames[os] ?? 'Unknown'})`);
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
