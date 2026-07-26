import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (input: string): Uint8Array => {
  const cleaned = input.replace(/[\s:,-]/g, '').replace(/0x/gi, '').toLowerCase();
  if (cleaned.length === 0) return new Uint8Array(0);
  if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
  if (!/^[0-9a-f]+$/.test(cleaned)) throw new Error('包含非十六进制字符');
  const result = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    result[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return result;
};

interface Signature {
  hex: string;
  type: string;
  ext: string;
  mime: string;
}

const SIGNATURES: Signature[] = [
  { hex: '89504e47', type: 'PNG 图片', ext: '.png', mime: 'image/png' },
  { hex: 'ffd8ffe0', type: 'JPEG 图片 (JFIF)', ext: '.jpg', mime: 'image/jpeg' },
  { hex: 'ffd8ffe1', type: 'JPEG 图片 (EXIF)', ext: '.jpg', mime: 'image/jpeg' },
  { hex: 'ffd8ff', type: 'JPEG 图片', ext: '.jpg', mime: 'image/jpeg' },
  { hex: '47494638', type: 'GIF 图片', ext: '.gif', mime: 'image/gif' },
  { hex: '424d', type: 'BMP 图片', ext: '.bmp', mime: 'image/bmp' },
  { hex: '00000100', type: 'ICO 图标', ext: '.ico', mime: 'image/x-icon' },
  { hex: '25504446', type: 'PDF 文档', ext: '.pdf', mime: 'application/pdf' },
  { hex: '504b0304', type: 'ZIP 压缩包', ext: '.zip', mime: 'application/zip' },
  { hex: '504b0506', type: 'ZIP 空压缩包', ext: '.zip', mime: 'application/zip' },
  { hex: '1f8b', type: 'GZIP 压缩包', ext: '.gz', mime: 'application/gzip' },
  { hex: '52617221', type: 'RAR 压缩包', ext: '.rar', mime: 'application/x-rar' },
  { hex: '377abcaf', type: '7z 压缩包', ext: '.7z', mime: 'application/x-7z' },
  { hex: '7f454c46', type: 'ELF 可执行文件', ext: '', mime: 'application/x-elf' },
  { hex: '4d5a', type: 'PE 可执行文件 (Windows)', ext: '.exe', mime: 'application/x-msdownload' },
  { hex: 'cafebabe', type: 'Java Class / Mach-O', ext: '.class', mime: 'application/java-vm' },
  { hex: '494433', type: 'MP3 音频', ext: '.mp3', mime: 'audio/mpeg' },
  { hex: '664c6143', type: 'FLAC 音频', ext: '.flac', mime: 'audio/flac' },
  { hex: '52494646', type: 'RIFF (WAV/AVI)', ext: '.wav', mime: 'audio/wav' },
  { hex: '4f676753', type: 'OGG 多媒体', ext: '.ogg', mime: 'audio/ogg' },
  { hex: '1a45dfa3', type: 'Matroska/EBML', ext: '.mkv', mime: 'video/x-matroska' },
  { hex: '49492a00', type: 'TIFF 图片 (LE)', ext: '.tiff', mime: 'image/tiff' },
  { hex: '4d4d002a', type: 'TIFF 图片 (BE)', ext: '.tiff', mime: 'image/tiff' },
  { hex: '38425053', type: 'Photoshop PSD', ext: '.psd', mime: 'image/vnd.adobe.photoshop' },
  { hex: '25215053', type: 'PostScript', ext: '.ps', mime: 'application/postscript' },
  { hex: '7b5c7274', type: 'RTF 文档', ext: '.rtf', mime: 'application/rtf' },
  { hex: 'd0cf11e0', type: 'Office 文档 (OLE2)', ext: '.doc', mime: 'application/msword' },
  { hex: '53503031', type: 'QR Code PNG', ext: '.png', mime: 'image/png' },
  { hex: '3c21444f', type: 'HTML 文档', ext: '.html', mime: 'text/html' },
  { hex: '3c68746d', type: 'HTML 文档', ext: '.html', mime: 'text/html' },
  { hex: '3c3f786d', type: 'XML 文档', ext: '.xml', mime: 'application/xml' },
  { hex: 'efbbbf', type: 'UTF-8 BOM 文本', ext: '.txt', mime: 'text/plain' },
  { hex: 'fffe', type: 'UTF-16LE BOM 文本', ext: '.txt', mime: 'text/plain' },
  { hex: 'feff', type: 'UTF-16BE BOM 文本', ext: '.txt', mime: 'text/plain' },
  { hex: '6d616e69', type: 'Apple plist', ext: '.plist', mime: 'application/xml' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const hex = Array.from(bytes.slice(0, 16))
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      const headerHex = Array.from(bytes.slice(0, 16))
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join(' ');
      let matched: Signature | null = null;
      for (const sig of SIGNATURES) {
        if (hex.startsWith(sig.hex.toLowerCase())) {
          matched = sig;
          break;
        }
      }
      if (matched) {
        return [
          '=== 文件类型识别结果 ===',
          `类型: ${matched.type}`,
          `扩展名: ${matched.ext || '(无)'}`,
          `MIME: ${matched.mime}`,
          `魔数: ${matched.hex}`,
          `头部(16字节): ${headerHex}`,
        ].join('\n');
      }
      return [
        '=== 文件类型识别结果 ===',
        '未匹配到已知文件类型',
        `头部(16字节): ${headerHex}`,
        '提示: 输入可能为纯文本或未知格式',
      ].join('\n');
    }}
  />
);
export default ToolComponent;
