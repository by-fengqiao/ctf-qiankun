import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) !== 0 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

const crc32Hex = (data: Uint8Array): string => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0').toUpperCase();
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      const hashes: { name: string; value: string }[] = [
        { name: 'MD5', value: CryptoJS.MD5(input).toString() },
        { name: 'SHA1', value: CryptoJS.SHA1(input).toString() },
        { name: 'SHA224', value: CryptoJS.SHA224(input).toString() },
        { name: 'SHA256', value: CryptoJS.SHA256(input).toString() },
        { name: 'SHA384', value: CryptoJS.SHA384(input).toString() },
        { name: 'SHA512', value: CryptoJS.SHA512(input).toString() },
        { name: 'SHA3', value: CryptoJS.SHA3(input).toString() },
        { name: 'CRC32', value: crc32Hex(bytes) },
      ];
      const maxName = Math.max(...hashes.map((h: { name: string }) => h.name.length));
      return hashes
        .map((h: { name: string; value: string }) => `${h.name.padEnd(maxName)} : ${h.value}`)
        .join('\n');
    }}
  />
);
export default ToolComponent;
