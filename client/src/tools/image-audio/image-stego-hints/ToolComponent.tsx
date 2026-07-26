import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, bytesToText, readU32BE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      const results: string[] = ['隐写分析提示', ''];
      let bytes: Uint8Array;
      if (file) {
        results.push(`文件名: ${file.name}`);
        results.push(`文件类型: ${file.type}`);
        results.push(`文件大小: ${file.size} 字节`);
        results.push('');
        results.push('⚠ 文件模式: 请将文件转为十六进制后粘贴以进行深度分析');
        results.push('');
        results.push('── 通用隐写检查清单 ──');
        results.push('  [✓] 文件尾部附加数据 — 检查文件结束标记后是否有额外字节');
        results.push('  [✓] 元数据隐藏 (EXIF/XMP) — 检查元数据中的隐藏信息');
        results.push('  [✓] LSB 隐写 — 检查像素最低有效位');
        results.push('  [✓] 颜色通道隐藏 — 检查特定通道是否有隐藏图像');
        results.push('  [✓] 文件格式伪装 — 检查文件头与扩展名是否匹配');
        if (file.type.startsWith('image/')) {
          results.push('');
          results.push('── 图片隐写专项 ──');
          results.push('  [✓] PNG: 检查 IDAT/IEND 之间的额外 chunk');
          results.push('  [✓] JPEG: 检查 FFD9 后附加数据、APP 段隐藏');
          results.push('  [✓] GIF: 检查帧延迟、注释扩展块');
          results.push('  [✓] BMP: 检查调色板、像素数据末尾');
        }
        if (file.type.startsWith('audio/')) {
          results.push('');
          results.push('── 音频隐写专项 ──');
          results.push('  [✓] WAV: 检查 LSB 隐写、隐藏 chunk');
          results.push('  [✓] 频谱图: 检查频谱中的隐藏图像');
          results.push('  [✓] SSTV: 检查是否包含慢扫描电视信号');
          results.push('  [✓] DTMF: 检查双音多频信号');
        }
        results.push('', '建议: 使用 hex-viewer 工具查看文件十六进制以进一步分析');
        return results.join('\n');
      }
      if (!input) return '请输入十六进制数据或拖入文件进行隐写分析';
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入十六进制数据或拖入文件进行隐写分析';
      }
      results.push(`数据长度: ${bytes.length} 字节`);
      results.push('');
      results.push('── 文件类型识别 ──');
      let fileType = '未知';
      let fileExt = '';
      if (bytes.length >= 4) {
        const sig = bytesToText(bytes.slice(0, 4));
        if (sig === '\x89PNG') { fileType = 'PNG'; fileExt = '.png'; }
        else if (bytes[0] === 0xff && bytes[1] === 0xd8) { fileType = 'JPEG'; fileExt = '.jpg'; }
        else if (sig === 'RIFF' && bytesToText(bytes.slice(8, 12)) === 'WAVE') { fileType = 'WAV'; fileExt = '.wav'; }
        else if (sig === 'GIF8') { fileType = 'GIF'; fileExt = '.gif'; }
        else if (bytes[0] === 0x42 && bytes[1] === 0x4d) { fileType = 'BMP'; fileExt = '.bmp'; }
        else if (bytes[0] === 0x50 && bytes[1] === 0x4b) { fileType = 'ZIP'; fileExt = '.zip'; }
        else if (bytesToText(bytes.slice(0, 2)) === 'PK') { fileType = 'ZIP/PK'; fileExt = '.zip'; }
        else if (bytes[0] === 0x1f && bytes[1] === 0x8b) { fileType = 'GZIP'; fileExt = '.gz'; }
      }
      results.push(`  文件类型: ${fileType} ${fileExt}`);
      results.push(`  魔数: ${Array.from(bytes.slice(0, 8)).map((b: number) => b.toString(16).padStart(2, '0')).join(' ').toUpperCase()}`);
      results.push('');
      results.push('── 隐写检查清单 ──');
      if (fileType === 'PNG') {
        results.push('  [PNG] 隐写检查:');
        let offset = 8;
        const chunks: string[] = [];
        while (offset + 8 <= bytes.length) {
          const chunkType = bytesToText(bytes.slice(offset + 4, offset + 8));
          const chunkLen = readU32BE(bytes, offset);
          chunks.push(`${chunkType} (${chunkLen}B @ ${offset})`);
          if (chunkType === 'IEND') {
            const afterIend = bytes.length - (offset + 12);
            if (afterIend > 0) {
              results.push(`    ⚠ IEND 后有 ${afterIend} 字节附加数据!`);
              const trailing = bytesToText(bytes.slice(offset + 12, offset + 12 + Math.min(200, afterIend)));
              results.push(`    附加数据预览: ${trailing.replace(/[^\x20-\x7e]/g, '.')}`);
            } else {
              results.push('    ✓ IEND 后无附加数据');
            }
            break;
          }
          offset += 12 + chunkLen;
        }
        results.push(`    Chunk 列表: ${chunks.join(', ')}`);
        const hasText = chunks.some((c: string) => c.startsWith('tEXt') || c.startsWith('zTXt') || c.startsWith('iTXt'));
        if (hasText) results.push('    ⚠ 存在文本 chunk — 检查隐藏文本');
        const hasExif = chunks.some((c: string) => c.startsWith('eXIf'));
        if (hasExif) results.push('    ⚠ 存在 EXIF chunk — 检查元数据隐藏');
      } else if (fileType === 'JPEG') {
        results.push('  [JPEG] 隐写检查:');
        let foundEoi = false;
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
            foundEoi = true;
            const afterEoi = bytes.length - (i + 2);
            if (afterEoi > 0) {
              results.push(`    ⚠ FFD9 (EOI) 后有 ${afterEoi} 字节附加数据!`);
              const trailing = bytesToText(bytes.slice(i + 2, i + 2 + Math.min(200, afterEoi)));
              results.push(`    附加数据预览: ${trailing.replace(/[^\x20-\x7e]/g, '.')}`);
            } else {
              results.push('    ✓ FFD9 后无附加数据');
            }
            break;
          }
        }
        if (!foundEoi) results.push('    ⚠ 未找到 FFD9 结束标记');
        let hasExif = false;
        for (let i = 0; i < bytes.length - 4; i++) {
          if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
            const magic = bytesToText(bytes.slice(i + 4, i + 8));
            if (magic === 'Exif') { hasExif = true; break; }
          }
        }
        if (hasExif) results.push('    ⚠ 存在 EXIF 数据 — 检查元数据隐藏');
      } else if (fileType === 'GIF') {
        results.push('  [GIF] 隐写检查:');
        let foundTrailer = false;
        for (let i = bytes.length - 1; i >= 0; i--) {
          if (bytes[i] === 0x3b) {
            foundTrailer = true;
            const after = bytes.length - (i + 1);
            if (after > 0) {
              results.push(`    ⚠ GIF Trailer (3B) 后有 ${after} 字节附加数据!`);
            }
            break;
          }
        }
        if (!foundTrailer) results.push('    ⚠ 未找到 GIF Trailer (3B)');
      } else if (fileType === 'WAV') {
        results.push('  [WAV] 隐写检查:');
        results.push('    [✓] LSB 隐写 — 使用 audio-lsb-extract 工具提取');
        results.push('    [✓] 隐藏 chunk — 检查非标准 chunk');
        results.push('    [✓] SSTV 信号 — 使用 sstv-identify 工具检测');
      } else if (fileType === 'BMP') {
        results.push('  [BMP] 隐写检查:');
        results.push('    [✓] 调色板隐藏 — 检查颜色表中的隐藏数据');
        results.push('    [✓] 像素数据末尾 — 检查附加数据');
        results.push('    [✓] LSB 隐写 — 检查像素最低位');
      } else if (fileType === 'ZIP' || fileType === 'ZIP/PK' || fileType === 'GZIP') {
        results.push('  [压缩文件] 隐写检查:');
        results.push('    [✓] 隐藏文件 — 解压后检查是否有隐藏文件');
        results.push('    [✓] 注释字段 — 检查 ZIP 注释中的隐藏信息');
        results.push('    [✓] 附加数据 — 压缩文件后可能有其他文件拼接');
      }
      const printable: number[] = [];
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] >= 0x20 && bytes[i] <= 0x7e) printable.push(bytes[i]);
      }
      if (printable.length > 10) {
        const text = bytesToText(new Uint8Array(printable));
        const interesting = text.match(/[\x20-\x7e]{6,}/g);
        if (interesting && interesting.length > 0) {
          results.push('', '── 可疑字符串 ──');
          for (const s of interesting.slice(0, 10)) {
            results.push(`  "${s}"`);
          }
        }
      }
      results.push('', '── 建议工具 ──');
      results.push('  • hex-viewer — 十六进制查看');
      results.push('  • lsb-check — LSB 隐写检测');
      results.push('  • file-header-tail — 文件头尾分析');
      results.push('  • string-extract — 字符串提取');
      return results.join('\n');
    }}
  />
);

export default ToolComponent;
