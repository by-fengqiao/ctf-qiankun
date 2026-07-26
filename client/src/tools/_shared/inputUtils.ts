import { parseHex } from './hexUtils';

const MIN_HEX_LEN = 16;

export function getInputBytes(input: string): Uint8Array {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  if (cleaned.length >= MIN_HEX_LEN && cleaned.length % 2 === 0 && /^[0-9A-Fa-f]+$/.test(cleaned)) {
    try {
      return parseHex(input);
    } catch {
      // fall through to TextEncoder
    }
  }
  return new TextEncoder().encode(input);
}

const BINARY_MAX_HEX_BYTES = 262144;

export function isBinaryFile(file: File): boolean {
  if (file.type.startsWith('text/')) return false;
  if (file.type === 'application/json' || file.type === 'application/xml' || file.type === 'application/javascript') return false;
  if (file.type === '') {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const textExts = ['txt', 'csv', 'json', 'xml', 'js', 'ts', 'py', 'md', 'log', 'yaml', 'yml', 'html', 'css', 'svg'];
    if (textExts.includes(ext)) return false;
    return true;
  }
  return true;
}

export function readFileAsHex(file: File, maxBytes: number = BINARY_MAX_HEX_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = new Uint8Array(reader.result as ArrayBuffer);
      const limit = Math.min(buffer.length, maxBytes);
      const parts: string[] = [];
      for (let i = 0; i < limit; i++) {
        parts.push(buffer[i].toString(16).padStart(2, '0'));
      }
      let result = parts.join('');
      if (buffer.length > maxBytes) {
        result += `\n\n(文件过大，仅显示前 ${maxBytes} 字节的十六进制数据，共 ${buffer.length} 字节)`;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
