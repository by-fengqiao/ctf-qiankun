import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU16BE, readU32BE, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const EXIF_TAGS: Record<number, string> = {
  0x010E: '图像描述', 0x010F: '相机制造商', 0x0110: '相机型号',
  0x0112: '方向', 0x011A: 'X 分辨率', 0x011B: 'Y 分辨率',
  0x0132: '拍摄时间', 0x8769: 'Exif 偏移', 0x8825: 'GPS 偏移',
  0x829A: '曝光时间', 0x829D: '光圈值', 0x9201: '快门速度',
  0x9202: '光圈', 0x9204: '曝光补偿', 0x9207: '测光模式',
  0x9209: '闪光灯', 0xA002: '像素宽度', 0xA003: '像素高度',
  0xA210: '焦平面分辨率单位', 0xA215: '曝光指数', 0xA300: '文件来源',
  0xA301: '场景类型', 0x0001: 'GPS 纬度参考', 0x0002: 'GPS 纬度',
  0x0003: 'GPS 经度参考', 0x0004: 'GPS 经度', 0x0005: 'GPS 海拔参考',
  0x0006: 'GPS 海拔', 0x0007: 'GPS 时间戳',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入 JPEG 文件的十六进制数据进行 EXIF 解析';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入 JPEG 文件的十六进制数据进行 EXIF 解析';
      }
      if (bytes.length < 4) return '数据不足';
      const results: string[] = ['EXIF 信息提取', `数据长度: ${bytes.length} 字节`, ''];
      let isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      if (!isJpeg) {
        results.push('⚠ 非 JPEG 格式（未检测到 FFD8 标记）');
        results.push('EXIF 数据通常嵌入在 JPEG 的 APP1 段中');
        return results.join('\n');
      }
      results.push('✓ 检测到 JPEG 文件头 (FFD8)');
      let foundExif = false;
      for (let i = 2; i < bytes.length - 1; i += 2) {
        if (bytes[i] !== 0xff) break;
        const marker = bytes[i + 1];
        if (marker === 0xd9) { results.push('  EOI (FFD9) - 文件结束'); break; }
        if (marker === 0xda) { results.push('  SOS (FFDA) - 扫描开始, EXIF 在此之前'); break; }
        if (marker === 0xe1 && i + 10 < bytes.length) {
          const segLen = readU16BE(bytes, i + 2);
          const magic = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
          if (magic === 'Exif') {
            foundExif = true;
            const tiffStart = i + 10;
            const endian = String.fromCharCode(bytes[tiffStart], bytes[tiffStart + 1]);
            results.push(`  APP1 段 (FFE1) - 找到 Exif 数据`);
            results.push(`  段长度: ${segLen} 字节`);
            results.push(`  字节序: ${endian} (${endian === 'II' ? '小端 (Intel)' : endian === 'MM' ? '大端 (Motorola)' : '未知'})`);
            const ifdOffset = endian === 'II' ? readU32LE(bytes, tiffStart + 4) : readU32BE(bytes, tiffStart + 4);
            results.push(`  IFD0 偏移: ${ifdOffset}`);
            results.push('', '── 常见 EXIF 标签 ──');
            for (const [tag, name] of Object.entries(EXIF_TAGS)) {
              results.push(`  0x${parseInt(tag).toString(16).padStart(4, '0').toUpperCase()}: ${name}`);
            }
          }
        }
      }
      if (!foundExif) {
        results.push('', '⚠ 未找到 EXIF 数据 (APP1/Exif 段)');
        results.push('提示: 部分 JPEG 可能不包含 EXIF 元数据');
      }
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
