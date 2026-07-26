import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 20) {
    throw new Error('数据过短，无法解析 Android 备份文件');
  }
  
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Android 备份解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const magic = bytesToText(bytes.subarray(0, 14));
  if (magic !== 'ANDROID BACKUP') {
    throw new Error('无效的 Android 备份文件（期望 "ANDROID BACKUP" 头部）');
  }

  let pos = 14;
  if (pos < bytes.length && bytes[pos] === 0x0a) pos++;
  
  // Read version
  const versionEnd = bytes.indexOf(0x0a, pos);
  if (versionEnd < 0) throw new Error('无效的备份文件：缺少版本信息');
  const version = bytesToText(bytes.subarray(pos, versionEnd)).trim();
  pos = versionEnd + 1;

  // Read compression
  const compEnd = bytes.indexOf(0x0a, pos);
  if (compEnd < 0) throw new Error('无效的备份文件：缺少压缩标识');
  const compression = bytesToText(bytes.subarray(pos, compEnd)).trim();
  pos = compEnd + 1;

  // Read encryption
  const encEnd = bytes.indexOf(0x0a, pos);
  if (encEnd < 0) throw new Error('无效的备份文件：缺少加密标识');
  const encryption = bytesToText(bytes.subarray(pos, encEnd)).trim();
  pos = encEnd + 1;

  L.push('── 头部信息 ──');
  L.push(`  版本: ${version}`);
  L.push(`  压缩: ${compression === '1' ? '启用 (zlib/deflate)' : '禁用'}`);
  L.push(`  加密: ${encryption === 'none' ? '无' : encryption}`);
  L.push('');

  let passwordHint = '';
  let salt = '';
  if (encryption !== 'none') {
    const hintEnd = bytes.indexOf(0x0a, pos);
    if (hintEnd >= 0) {
      passwordHint = bytesToText(bytes.subarray(pos, hintEnd)).trim();
      pos = hintEnd + 1;
      const saltEnd = bytes.indexOf(0x0a, pos);
      if (saltEnd >= 0) {
        salt = bytesToText(bytes.subarray(pos, saltEnd)).trim();
        pos = saltEnd + 1;
      }
    }
    L.push('── 加密信息 ──');
    L.push(`  密码提示: ${passwordHint || '(无)'}`);
    L.push(`  Salt: ${salt || '(无)'}`);
    L.push('');
  }

  const dataBytes = bytes.subarray(pos);
  L.push('── 载荷信息 ──');
  L.push(`  总大小: ${bytes.length} 字节`);
  L.push(`  载荷大小: ${dataBytes.length} 字节`);
  
  if (dataBytes.length > 0) {
    const firstByte = dataBytes[0];
    if (firstByte === 0x78) {
      const cmf = firstByte;
      const flg = dataBytes[1] ?? 0;
      const compressionLevel = (flg >> 6) & 0x03;
      let levelDesc = '默认';
      if (compressionLevel === 0) levelDesc = '最快';
      else if (compressionLevel === 1) levelDesc = '快速';
      else if (compressionLevel === 2) levelDesc = '默认';
      else if (compressionLevel === 3) levelDesc = '最高';
      
      L.push('');
      L.push('  ✅ 检测到 zlib 压缩流');
      L.push(`    CMF: 0x${cmf.toString(16).padStart(2, '0')}`);
      L.push(`    FLG: 0x${flg.toString(16).padStart(2, '0')}`);
      L.push(`    压缩级别: ${levelDesc}`);
      L.push(`    校验和正确: ${((cmf * 256 + flg) % 31 === 0) ? '是' : '否'}`);
    } else {
      const first16 = dataBytes.subarray(0, Math.min(16, dataBytes.length));
      L.push('');
      L.push('  载荷头部 16 字节:');
      L.push(`    ${first16.reduce((str, b) => str + b.toString(16).padStart(2, '0') + ' ', '')}`);
    }
  }

  if (compression === '1') {
    L.push('');
    L.push('💡 提示: 备份启用了 zlib 压缩，可使用 zlib 解压工具解压载荷获取内容。');
  }
  if (encryption !== 'none') {
    L.push('');
    L.push('⚠️ 提示: 备份已加密，需要输入密码才能解密数据。');
  }

  return L.join('\\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="Android备份解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 10 * 1024 * 1024);
        const noteIdx = hex.indexOf('\\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
