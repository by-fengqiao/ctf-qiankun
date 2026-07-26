import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU32BE, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const CHUNK_TYPES: Record<string, string> = {
  IHDR: '图像头数据', PLTE: '调色板', IDAT: '图像数据',
  IEND: '图像结束', tEXt: '文本', zTXt: '压缩文本',
  iTXt: '国际文本', tIME: '时间戳', bKGD: '背景色',
  cHRM: '色度', gAMA: '伽马', iCCP: 'ICC 配置',
  sBIT: '有效位', sRGB: 'sRGB', pHYs: '物理像素',
  tRNS: '透明度', hIST: '直方图', sPLT: '建议调色板',
  acTL: '动画控制', fcTL: '帧控制', fdAT: '帧数据',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 PNG 文件的十六进制数据进行分析';
      if (!input) return '请输入 PNG 文件的十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 PNG 文件的十六进制数据';
      }
      if (bytes.length < 8) return '数据不足';
      const sig = bytesToHex(bytes, 0, 8);
      const results: string[] = [];
      if (sig === '89 50 4E 47 0D 0A 1A 0A') {
        results.push('✓ PNG 文件签名正确');
      } else {
        results.push(`✗ 文件签名不匹配: ${sig}`);
        results.push('  期望: 89 50 4E 47 0D 0A 1A 0A');
        return results.join('\n');
      }
      let offset = 8;
      let chunkIdx = 0;
      while (offset + 8 <= bytes.length) {
        const length = readU32BE(bytes, offset);
        const type = String.fromCharCode(
          bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7],
        );
        const desc = CHUNK_TYPES[type] ?? '未知';
        results.push(
          `  [${chunkIdx}] ${type} (${desc}): 长度=${length} 字节, 偏移=${offset}`,
        );
        if (type === 'IHDR' && offset + 8 + 13 <= bytes.length) {
          const w = readU32BE(bytes, offset + 8);
          const h = readU32BE(bytes, offset + 12);
          const bitDepth = bytes[offset + 16];
          const colorType = bytes[offset + 17];
          const compression = bytes[offset + 18];
          const filter = bytes[offset + 19];
          const interlace = bytes[offset + 20];
          const colorNames: Record<number, string> = {
            0: '灰度', 2: '真彩色 (RGB)', 3: '索引色', 4: '灰度+Alpha', 6: '真彩色+Alpha (RGBA)',
          };
          results.push(`      宽度: ${w}`);
          results.push(`      高度: ${h}`);
          results.push(`      位深度: ${bitDepth}`);
          results.push(`      颜色类型: ${colorType} (${colorNames[colorType] ?? '未知'})`);
          results.push(`      压缩方式: ${compression}`);
          results.push(`      滤波方式: ${filter}`);
          results.push(`      隔行扫描: ${interlace === 0 ? '无' : 'Adam7'}`);
        }
        if (type === 'IEND') break;
        offset += 12 + length;
        chunkIdx++;
      }
      return ['PNG 结构分析', `文件大小: ${bytes.length} 字节`, `块数量: ${chunkIdx}`, '', '── 块列表 ──', ...results.slice(1)].join('\n');
    }}
  />
);
export default ToolComponent;
