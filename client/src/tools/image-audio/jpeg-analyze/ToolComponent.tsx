import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const MARKERS: Record<string, string> = {
  D8: 'SOI - 图像开始', D9: 'EOI - 图像结束', C0: 'SOF0 - 基线 DCT',
  C2: 'SOF2 - 渐进式 DCT', C4: 'DHT - 哈夫曼表', DA: 'SOS - 扫描开始',
  DB: 'DQT - 量化表', DD: 'DRI - 重启间隔', E0: 'APP0 - JFIF',
  E1: 'APP1 - EXIF/XMP', E2: 'APP2 - ICC', FE: 'COM - 注释',
  D0: 'RST0', D1: 'RST1', D2: 'RST2', D3: 'RST3',
  D4: 'RST4', D5: 'RST5', D6: 'RST6', D7: 'RST7',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴 JPEG 文件的十六进制数据进行分析';
      if (!input) return '请输入 JPEG 文件的十六进制数据';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 JPEG 文件的十六进制数据';
      }
      if (bytes.length < 4) return '数据不足';
      const results: string[] = [];
      if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) {
        return '✗ 非 JPEG 文件（未检测到 FFD8 标记）';
      }
      results.push('✓ JPEG 文件签名正确 (FFD8)');
      let offset = 2;
      let markerCount = 0;
      while (offset + 1 < bytes.length) {
        if (bytes[offset] !== 0xff) break;
        let marker = bytes[offset + 1].toString(16).toUpperCase();
        if (marker === '00') { offset += 2; continue; }
        if (marker >= 'D0' && marker <= 'D7') {
          results.push(`  [${markerCount}] FFD${marker[1]} - ${MARKERS[marker] ?? 'RST'} (无长度)`);
          offset += 2;
          markerCount++;
          continue;
        }
        if (marker === 'D9') {
          results.push(`  [${markerCount}] FFD9 - EOI 图像结束`);
          break;
        }
        if (offset + 3 >= bytes.length) break;
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        const desc = MARKERS[marker] ?? `未知标记 (FF${marker})`;
        results.push(`  [${markerCount}] FF${marker} - ${desc}: 长度=${segLen}, 偏移=${offset}`);
        if (marker === 'C0' || marker === 'C2') {
          if (offset + 9 < bytes.length) {
            const prec = bytes[offset + 4];
            const h = (bytes[offset + 5] << 8) | bytes[offset + 6];
            const w = (bytes[offset + 7] << 8) | bytes[offset + 8];
            const comps = bytes[offset + 9];
            results.push(`      精度: ${prec} 位`);
            results.push(`      尺寸: ${w} × ${h}`);
            results.push(`      分量数: ${comps}`);
          }
        }
        if (marker === 'E0' && offset + 14 < bytes.length) {
          const id = String.fromCharCode(bytes[offset + 4], bytes[offset + 5]);
          if (id === 'JF') results.push('      JFIF 标识符');
        }
        if (marker === 'DA') {
          results.push('  (后续为压缩图像数据)');
          break;
        }
        offset += 2 + segLen;
        markerCount++;
      }
      return ['JPEG 结构分析', `文件大小: ${bytes.length} 字节`, `标记数量: ${markerCount}`, '', '── 标记列表 ──', ...results.slice(1)].join('\n');
    }}
  />
);
export default ToolComponent;
