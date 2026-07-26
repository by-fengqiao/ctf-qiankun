import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 GIF 文件的十六进制数据进行分析';
      if (!input) return '请输入 GIF 文件的十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 GIF 文件的十六进制数据';
      }
      if (bytes.length < 13) return '数据不足，GIF 至少需要 13 字节';
      const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
      const ver = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
      const results: string[] = [];
      if (sig !== 'GIF' || (ver !== '87a' && ver !== '89a')) {
        return `✗ 非 GIF 文件（签名: ${sig}${ver}）`;
      }
      results.push(`✓ GIF 文件签名正确 (${sig}${ver})`);
      const width = readU16LE(bytes, 6);
      const height = readU16LE(bytes, 8);
      const packed = bytes[10];
      const globalColorTableFlag = (packed & 0x80) !== 0;
      const colorResolution = ((packed & 0x70) >> 4) + 1;
      const sortFlag = (packed & 0x08) !== 0;
      const gctSize = globalColorTableFlag ? 3 * (2 ** ((packed & 0x07) + 1)) : 0;
      const bgColorIndex = bytes[11];
      const pixelAspectRatio = bytes[12];
      results.push(`  宽度: ${width}`);
      results.push(`  高度: ${height}`);
      results.push(`  全局颜色表: ${globalColorTableFlag ? '有' : '无'}`);
      if (globalColorTableFlag) {
        results.push(`    颜色分辨率: ${colorResolution} 位`);
        results.push(`    排序标志: ${sortFlag ? '已排序' : '未排序'}`);
        results.push(`    颜色表大小: ${gctSize} 字节 (${gctSize / 3} 色)`);
      }
      results.push(`  背景色索引: ${bgColorIndex}`);
      results.push(`  像素宽高比: ${pixelAspectRatio === 0 ? '1:1' : `${(pixelAspectRatio + 15) / 64}:1`}`);
      let offset = 13 + gctSize;
      let frameCount = 0;
      const blocks: string[] = [];
      while (offset < bytes.length - 1) {
        const block = bytes[offset];
        if (block === 0x3b) { blocks.push('  结束符 (3B)'); break; }
        if (block === 0x21) {
          const label = bytes[offset + 1];
          const labelNames: Record<number, string> = {
            0xF9: '图形控制扩展', 0xFE: '注释扩展', 0xFF: '应用扩展', 0x01: '纯文本扩展',
          };
          blocks.push(`  扩展块 (21 ${label.toString(16).toUpperCase().padStart(2, '0')}): ${labelNames[label] ?? '未知'} @${offset}`);
          offset += 2;
          while (offset < bytes.length && bytes[offset] !== 0) {
            const subLen = bytes[offset];
            offset += 1 + subLen;
          }
          offset++;
        } else if (block === 0x2c) {
          frameCount++;
          const lw = readU16LE(bytes, offset + 1);
          const th = readU16LE(bytes, offset + 3);
          const lp = bytes[offset + 5];
          const interlace = (lp & 0x40) !== 0;
          blocks.push(`  图像描述符 (2C) @${offset}: ${lw}×${th}, 隔行=${interlace}`);
          const lctFlag = (lp & 0x80) !== 0;
          const lctSize = lctFlag ? 3 * (2 ** ((lp & 0x07) + 1)) : 0;
          offset += 10 + lctSize;
          offset++;
          while (offset < bytes.length && bytes[offset] !== 0) {
            offset += 1 + bytes[offset];
          }
          offset++;
        } else {
          blocks.push(`  未知块: 0x${block.toString(16).toUpperCase()} @${offset}`);
          break;
        }
      }
      return [
        'GIF 结构分析', `文件大小: ${bytes.length} 字节`,
        `帧数: ${frameCount}`, '', '── 全局信息 ──', ...results.slice(1),
        '', '── 块列表 ──', ...blocks,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
