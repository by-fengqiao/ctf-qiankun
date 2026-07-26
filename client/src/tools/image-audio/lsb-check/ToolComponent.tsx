import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴图片/音频文件的十六进制数据进行 LSB 检测';
      if (!input) return '请输入十六进制数据进行 LSB 隐写检测';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入十六进制数据进行 LSB 隐写检测';
      }
      if (bytes.length < 8) return '数据不足，至少需要 8 字节';
      const results: string[] = [
        'LSB 隐写检测',
        `数据长度: ${bytes.length} 字节`,
        '',
      ];
      const lsbBits: number[] = [];
      for (let i = 0; i < bytes.length; i++) {
        lsbBits.push(bytes[i] & 1);
      }
      const lsbBytes: number[] = [];
      for (let i = 0; i + 8 <= lsbBits.length; i += 8) {
        lsbBytes.push(parseInt(lsbBits.slice(i, i + 8).join(''), 2));
      }
      const lsbText = bytesToText(new Uint8Array(lsbBytes.slice(0, 256)));
      let printable = 0;
      for (const b of lsbBytes) {
        if (b >= 0x20 && b <= 0x7e) printable++;
      }
      const printableRatio = lsbBytes.length > 0 ? printable / lsbBytes.length : 0;
      results.push('── LSB 提取分析 ──');
      results.push(`  提取比特数: ${lsbBits.length}`);
      results.push(`  提取字节数: ${lsbBytes.length}`);
      results.push(`  可打印比例: ${(printableRatio * 100).toFixed(1)}%`);
      results.push('');
      if (printableRatio > 0.7) {
        results.push('✓ 高比例可打印字符 — 可能有效隐写数据');
        results.push('', '── LSB 提取文本 (前 256 字节) ──');
        results.push(lsbText || '(不可打印)');
      } else {
        results.push('⚠ 可打印字符比例低 — LSB 可能不含文本隐写');
        results.push('', '── LSB 提取十六进制 (前 128 字节) ──');
        results.push(lsbBytes.slice(0, 128).map((b: number) => b.toString(16).padStart(2, '0')).join(' '));
      }
      const ones = lsbBits.filter((b: number) => b === 1).length;
      const zeros = lsbBits.length - ones;
      const ratio = lsbBits.length > 0 ? ones / lsbBits.length : 0;
      results.push('', '── 比特分布 ──');
      results.push(`  0 的数量: ${zeros} (${(ratio * 100).toFixed(1)}% 是 1)`);
      results.push(`  1 的数量: ${ones}`);
      if (ratio > 0.45 && ratio < 0.55) {
        results.push('  ⚠ 0/1 比例接近 50% — 可能存在加密或随机数据');
      } else if (ratio > 0.7 || ratio < 0.3) {
        results.push('  比特分布偏向一方 — 可能不含隐写或数据结构特殊');
      }
      const bit2Bytes: number[] = [];
      for (let i = 0; i < bytes.length; i++) {
        bit2Bytes.push((bytes[i] >> 1) & 1);
      }
      const bit2Text = bytesToText(new Uint8Array(
        Array.from({ length: Math.floor(bit2Bytes.length / 8) }, (_, i: number) =>
          parseInt(bit2Bytes.slice(i * 8, i * 8 + 8).join(''), 2)
        )
      ).slice(0, 128));
      if (bit2Text && /[\x20-\x7e]{8,}/.test(bit2Text)) {
        results.push('', '── 第 2 位提取 (检测) ──');
        results.push('  ⚠ 第 2 位也发现可打印文本');
        results.push(bit2Text);
      }
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
