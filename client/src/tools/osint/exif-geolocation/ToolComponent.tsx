import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16BE, readU16LE, readU32BE, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

interface Rational {
  num: number;
  den: number;
}

function readRational(bytes: Uint8Array, offset: number, little: boolean): Rational {
  const num = little ? readU32LE(bytes, offset) : readU32BE(bytes, offset);
  const den = little ? readU32LE(bytes, offset + 4) : readU32BE(bytes, offset + 4);
  return { num, den };
}

function rationalToFloat(r: Rational): number {
  if (r.den === 0) return 0;
  return r.num / r.den;
}

function readGpsCoordinate(bytes: Uint8Array, valueOffset: number, tiffStart: number, little: boolean): number {
  const dms = [];
  for (let i = 0; i < 3; i++) {
    const ptr = (little ? readU32LE : readU32BE)(bytes, valueOffset + i * 8);
    const dmsRational = readRational(bytes, tiffStart + ptr, little);
    dms.push(rationalToFloat(dmsRational));
  }
  return dms[0] + dms[1] / 60 + dms[2] / 3600;
}

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="EXIF 地理定位"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file?: File | null): Promise<string> => {
      let hex = input;
      if (file) hex = await readFileAsHex(file);
      if (!hex.trim()) return '请粘贴 JPEG 文件的十六进制数据，或上传 JPEG 文件';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(hex);
      } catch {
        return '十六进制解析失败，请输入有效的 JPEG 十六进制数据';
      }
      if (bytes.length < 4) return '数据不足';
      const out: string[] = ['EXIF 地理定位', '═'.repeat(50), `数据长度: ${bytes.length} 字节`, ''];

      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        out.push('⚠ 非 JPEG 格式（未检测到 FFD8 标记）');
        out.push('GPS EXIF 数据通常嵌入在 JPEG 的 APP1 段中');
        return out.join('\n');
      }
      out.push('✓ 检测到 JPEG 文件头 (FFD8)');

      let tiffStart = -1;
      let little = true;
      for (let i = 2; i < bytes.length - 9; i += 2) {
        if (bytes[i] !== 0xff) break;
        const marker = bytes[i + 1];
        if (marker === 0xd9 || marker === 0xda) break;
        if (marker === 0xe1) {
          const segLen = readU16BE(bytes, i + 2);
          if (i + 10 < bytes.length) {
            const magic = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
            if (magic === 'Exif') {
              tiffStart = i + 10;
              const endian = String.fromCharCode(bytes[tiffStart], bytes[tiffStart + 1]);
              little = endian === 'II';
              out.push(`  APP1 段 (FFE1) - Exif 数据，段长 ${segLen} 字节`);
              out.push(`  字节序: ${endian} (${little ? '小端 Intel' : '大端 Motorola'})`);
              break;
            }
          }
        }
        const segLen = readU16BE(bytes, i + 2);
        i += segLen - 2;
      }

      if (tiffStart === -1) {
        out.push('', '⚠ 未找到 EXIF 数据 (APP1/Exif 段)');
        out.push('提示: 部分 JPEG 可能不包含 EXIF 元数据');
        return out.join('\n');
      }

      const readIfdEntry = (ifdOffset: number): { gpsPtr: number; exifPtr: number } => {
        const entryCount = (little ? readU16LE : readU16BE)(bytes, ifdOffset);
        let gpsPtr = 0;
        let exifPtr = 0;
        for (let e = 0; e < entryCount; e++) {
          const entryOffset = ifdOffset + 2 + e * 12;
          if (entryOffset + 12 > bytes.length) break;
          const tag = (little ? readU16LE : readU16BE)(bytes, entryOffset);
          if (tag === 0x8825) {
            gpsPtr = (little ? readU32LE : readU32BE)(bytes, entryOffset + 8);
          }
          if (tag === 0x8769) {
            exifPtr = (little ? readU32LE : readU32BE)(bytes, entryOffset + 8);
          }
        }
        return { gpsPtr, exifPtr };
      };

      const ifd0Offset = tiffStart + ((little ? readU32LE : readU32BE)(bytes, tiffStart + 4));
      const { gpsPtr } = readIfdEntry(tiffStart + ifd0Offset);

      if (gpsPtr === 0) {
        out.push('', '⚠ 未找到 GPS IFD（本图片不含 GPS 坐标信息）');
        out.push('提示: 拍照时需开启位置信息，或已在上传时被清除');
        return out.join('\n');
      }

      const gpsIfdOffset = tiffStart + gpsPtr;
      const gpsCount = (little ? readU16LE : readU16BE)(bytes, gpsIfdOffset);
      let latRef = 'N';
      let latOffset = 0;
      let lonRef = 'E';
      let lonOffset = 0;
      let altRef = 0;
      let altOffset = 0;
      let timeStampOffset = 0;
      let dateStamp = '';

      for (let e = 0; e < gpsCount; e++) {
        const entryOffset = gpsIfdOffset + 2 + e * 12;
        if (entryOffset + 12 > bytes.length) break;
        const tag = (little ? readU16LE : readU16BE)(bytes, entryOffset);
        const type = (little ? readU16LE : readU16BE)(bytes, entryOffset + 2);
        const count = (little ? readU32LE : readU32BE)(bytes, entryOffset + 4);
        const valOff = entryOffset + 8;
        if (tag === 0x0001) {
          latRef = String.fromCharCode(bytes[valOff]);
        } else if (tag === 0x0002) {
          latOffset = (little ? readU32LE : readU32BE)(bytes, valOff);
        } else if (tag === 0x0003) {
          lonRef = String.fromCharCode(bytes[valOff]);
        } else if (tag === 0x0004) {
          lonOffset = (little ? readU32LE : readU32BE)(bytes, valOff);
        } else if (tag === 0x0005) {
          altRef = bytes[valOff];
        } else if (tag === 0x0006) {
          altOffset = (little ? readU32LE : readU32BE)(bytes, valOff);
        } else if (tag === 0x0007) {
          timeStampOffset = (little ? readU32LE : readU32BE)(bytes, valOff);
        } else if (tag === 0x001d) {
          const strPtr = (little ? readU32LE : readU32BE)(bytes, valOff);
          let s = '';
          for (let c = 0; c < count - 1 && tiffStart + strPtr + c < bytes.length; c++) {
            s += String.fromCharCode(bytes[tiffStart + strPtr + c]);
          }
          dateStamp = s;
        }
      }

      out.push('', '── GPS 坐标 ──');
      const lat = readGpsCoordinate(bytes, tiffStart + latOffset, tiffStart, little);
      const lon = readGpsCoordinate(bytes, tiffStart + lonOffset, tiffStart, little);
      const latSigned = latRef === 'S' ? -lat : lat;
      const lonSigned = lonRef === 'W' ? -lon : lon;

      out.push(`纬度: ${lat.toFixed(6)}° ${latRef}`);
      out.push(`经度: ${lon.toFixed(6)}° ${lonRef}`);
      out.push(`十进制度: ${latSigned.toFixed(6)}, ${lonSigned.toFixed(6)}`);

      if (altOffset !== 0) {
        const alt = rationalToFloat(readRational(bytes, tiffStart + altOffset, little));
        const altSigned = altRef === 1 ? -alt : alt;
        out.push(`海拔: ${altSigned.toFixed(2)} m`);
      }

      out.push('', '── 地图链接 ──');
      out.push(`Google Maps: https://www.google.com/maps?q=${latSigned.toFixed(6)},${lonSigned.toFixed(6)}`);
      out.push(`Google Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latSigned.toFixed(6)},${lonSigned.toFixed(6)}`);
      out.push(`OpenStreetMap: https://www.openstreetmap.org/?mlat=${latSigned.toFixed(6)}&mlon=${lonSigned.toFixed(6)}#map=16/${latSigned.toFixed(6)}/${lonSigned.toFixed(6)}`);
      out.push(`Bing Maps: https://www.bing.com/maps?cp=${latSigned.toFixed(6)}~${lonSigned.toFixed(6)}`);

      if (timeStampOffset !== 0) {
        const t = readRational(bytes, tiffStart + timeStampOffset, little);
        const tMin = readRational(bytes, tiffStart + timeStampOffset + 8, little);
        const tSec = readRational(bytes, tiffStart + timeStampOffset + 16, little);
        const hh = Math.floor(rationalToFloat(t)).toString().padStart(2, '0');
        const mm = Math.floor(rationalToFloat(tMin)).toString().padStart(2, '0');
        const ss = Math.floor(rationalToFloat(tSec)).toString().padStart(2, '0');
        out.push('', '── 拍摄时间 ──');
        if (dateStamp) out.push(`日期: ${dateStamp}`);
        out.push(`时间: ${hh}:${mm}:${ss} (UTC)`);
      }

      return out.join('\n');
    }}
  />
);
export default ToolComponent;
