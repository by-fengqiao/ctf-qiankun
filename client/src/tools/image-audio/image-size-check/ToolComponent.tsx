import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, readU32BE, readU32LE, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file && !input) return '请粘贴图片文件的十六进制数据检查尺寸';
      if (!input) return '请输入图片文件的十六进制数据（至少前 24 字节）';
      let bytes: Uint8Array;
      try {
        bytes = parseHex(input);
      } catch {
        return '请输入图片文件的十六进制数据（至少前 24 字节）';
      }
      if (bytes.length < 8) return '数据不足，至少需要 8 字节';
      const sig = bytes.slice(0, 8);
      const sigHex = Array.from(sig).map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      let format = '未知';
      let width = 0;
      let height = 0;
      let bitDepth = 0;
      let extra = '';
      if (sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47) {
        format = 'PNG';
        width = readU32BE(bytes, 16);
        height = readU32BE(bytes, 20);
        bitDepth = bytes[24];
        const colorType = bytes[25];
        const ctNames: Record<number, string> = { 0: '灰度', 2: 'RGB', 3: '索引色', 4: '灰度+Alpha', 6: 'RGBA' };
        extra = `颜色类型: ${colorType} (${ctNames[colorType] ?? '未知'}), 位深度: ${bitDepth}`;
      } else if (sig[0] === 0xff && sig[1] === 0xd8) {
        format = 'JPEG';
        let off = 2;
        while (off + 8 < bytes.length) {
          if (bytes[off] !== 0xff) break;
          const m = bytes[off + 1];
          if (m >= 0xc0 && m <= 0xc3) {
            height = (bytes[off + 5] << 8) | bytes[off + 6];
            width = (bytes[off + 7] << 8) | bytes[off + 8];
            bitDepth = 8;
            extra = `SOF 类型: 0x${m.toString(16).toUpperCase()}, 精度: ${bytes[off + 4]} 位`;
            break;
          }
          const len = (bytes[off + 2] << 8) | bytes[off + 3];
          off += 2 + len;
        }
      } else if (sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46) {
        format = `GIF (${String.fromCharCode(bytes[3], bytes[4], bytes[5])})`;
        width = readU16LE(bytes, 6);
        height = readU16LE(bytes, 8);
        bitDepth = ((bytes[10] & 0x70) >> 4) + 1;
      } else if (sig[0] === 0x42 && sig[1] === 0x4d) {
        format = 'BMP';
        width = readU32LE(bytes, 18);
        height = readU32LE(bytes, 22);
        bitDepth = readU16LE(bytes, 28);
      } else if (sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46) {
        format = 'WebP (RIFF)';
        extra = '需进一步解析 VP8/VP8L/VP8X 块获取尺寸';
      } else {
        return [`图片尺寸检查`, `文件签名: ${sigHex}`, '✗ 无法识别的图片格式'].join('\n');
      }
      return [
        '图片尺寸检查',
        `文件签名: ${sigHex}`,
        `格式: ${format}`,
        `宽度: ${width} px`,
        `高度: ${height} px`,
        ...(bitDepth ? [`位深度: ${bitDepth} 位`] : []),
        ...(extra ? ['', `附加信息: ${extra}`] : []),
      ].join('\n');
    }}
  />
);
export default ToolComponent;
