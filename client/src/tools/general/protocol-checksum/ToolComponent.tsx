import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

function onesComplementSum(data: Uint8Array, startOffset: number): number {
  let sum = 0;
  for (let i = startOffset; i < data.length - 1; i += 2) {
    sum += (data[i] << 8) | data[i + 1];
  }
  if ((data.length - startOffset) % 2 !== 0) {
    sum += data[data.length - 1] << 8;
  }
  while (sum >> 16) {
    sum = (sum & 0xffff) + (sum >> 16);
  }
  return (~sum) & 0xffff;
}

function calcIPv4Checksum(bytes: Uint8Array): string {
  if (bytes.length < 20) {
    throw new Error('IPv4 头部至少需要 20 字节');
  }
  const ihl = (bytes[0] & 0x0f) * 4;
  if (bytes.length < ihl) {
    throw new Error(`IPv4 头部长度 ${ihl} 超过数据长度 ${bytes.length}`);
  }

  const header = bytes.subarray(0, ihl);
  const origChecksum = (header[10] << 8) | header[11];

  const tempBytes = new Uint8Array(header);
  tempBytes[10] = 0;
  tempBytes[11] = 0;

  const checksum = onesComplementSum(tempBytes, 0);

  let output = '=== IPv4 头部校验和 ===\n\n';
  output += `头部长度 (IHL): ${ihl} 字节\n`;
  output += `原始校验和: 0x${origChecksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `计算校验和: 0x${checksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `校验结果: ${origChecksum === checksum ? '✓ 匹配' : '✗ 不匹配'}\n\n`;

  output += '头部字段:\n';
  output += `  版本: ${(bytes[0] >> 4) & 0xf}\n`;
  output += `  IHL: ${bytes[0] & 0xf} (${ihl} 字节)\n`;
  output += `  TTL: ${bytes[8]}\n`;
  output += `  协议: ${bytes[9]} (${bytes[9] === 6 ? 'TCP' : bytes[9] === 17 ? 'UDP' : bytes[9] === 1 ? 'ICMP' : '其他'})\n`;
  output += `  源IP: ${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}\n`;
  output += `  目标IP: ${bytes[16]}.${bytes[17]}.${bytes[18]}.${bytes[19]}\n`;

  return output;
}

function calcTcpUdpChecksum(bytes: Uint8Array): string {
  if (bytes.length < 20) {
    throw new Error('数据太短，至少需要 20 字节 (伪头部12 + 最小头部8)');
  }

  const srcIp = bytes.subarray(0, 4);
  const dstIp = bytes.subarray(4, 8);
  const zero = bytes[8];
  const proto = bytes[9];
  const tcpLen = (bytes[10] << 8) | bytes[11];
  const data = bytes.subarray(12);

  let sum = 0;

  for (let i = 0; i < 4; i += 2) {
    sum += (srcIp[i] << 8) | srcIp[i + 1];
  }
  for (let i = 0; i < 4; i += 2) {
    sum += (dstIp[i] << 8) | dstIp[i + 1];
  }
  sum += proto;
  sum += data.length;

  let origChecksum = 0;
  let checksumOffset = 0;
  if (proto === 6) {
    checksumOffset = 16;
  } else {
    checksumOffset = 6;
  }
  if (data.length > checksumOffset + 1) {
    origChecksum = (data[checksumOffset] << 8) | data[checksumOffset + 1];
  }

  const tempData = new Uint8Array(data);
  if (tempData.length > checksumOffset + 1) {
    tempData[checksumOffset] = 0;
    tempData[checksumOffset + 1] = 0;
  }

  for (let i = 0; i < tempData.length - 1; i += 2) {
    sum += (tempData[i] << 8) | tempData[i + 1];
  }
  if (tempData.length % 2 !== 0) {
    sum += tempData[tempData.length - 1] << 8;
  }
  while (sum >> 16) {
    sum = (sum & 0xffff) + (sum >> 16);
  }
  const checksum = (~sum) & 0xffff;

  const protoName = proto === 6 ? 'TCP' : 'UDP';

  let output = `=== ${protoName} 校验和计算 ===\n\n`;
  output += `伪头部:\n`;
  output += `  源IP: ${srcIp[0]}.${srcIp[1]}.${srcIp[2]}.${srcIp[3]}\n`;
  output += `  目标IP: ${dstIp[0]}.${dstIp[1]}.${dstIp[2]}.${dstIp[3]}\n`;
  output += `  协议: ${proto} (${protoName})\n`;
  output += `  ${protoName}长度: ${data.length}\n\n`;
  output += `原始校验和: 0x${origChecksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `计算校验和: 0x${checksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `校验结果: ${origChecksum === checksum ? '✓ 匹配' : '✗ 不匹配'}\n`;

  return output;
}

function calcIcmpChecksum(bytes: Uint8Array): string {
  if (bytes.length < 4) {
    throw new Error('ICMP 数据太短，至少需要 4 字节');
  }

  const origChecksum = (bytes[2] << 8) | bytes[3];
  const tempBytes = new Uint8Array(bytes);
  tempBytes[2] = 0;
  tempBytes[3] = 0;

  const checksum = onesComplementSum(tempBytes, 0);

  let output = '=== ICMP 校验和计算 ===\n\n';
  output += `类型: ${bytes[0]} (${bytes[0] === 8 ? 'Echo Request' : bytes[0] === 0 ? 'Echo Reply' : '其他'})\n`;
  output += `代码: ${bytes[1]}\n`;
  output += `原始校验和: 0x${origChecksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `计算校验和: 0x${checksum.toString(16).padStart(4, '0').toUpperCase()}\n`;
  output += `校验结果: ${origChecksum === checksum ? '✓ 匹配' : '✗ 不匹配'}\n`;

  return output;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function calcCRC32(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  const result = (crc ^ 0xffffffff) >>> 0;
  return `=== CRC32 校验和 ===\n\n多项式: 0xEDB88320 (反向)\n数据长度: ${bytes.length} 字节\nCRC32: 0x${result.toString(16).padStart(8, '0').toUpperCase()}\nCRC32 (十进制): ${result}\n`;
}

function calcAdler32(bytes: Uint8Array): string {
  let a = 1;
  let b = 0;
  const mod = 65521;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % mod;
    b = (b + a) % mod;
  }
  const result = ((b << 16) | a) >>> 0;
  return `=== Adler32 校验和 ===\n\n模数: ${mod}\n数据长度: ${bytes.length} 字节\nAdler32: 0x${result.toString(16).padStart(8, '0').toUpperCase()}\nAdler32 (十进制): ${result}\n`;
}

function calcFletcher16(bytes: Uint8Array): string {
  let sum1 = 0;
  let sum2 = 0;
  const mod = 255;
  for (let i = 0; i < bytes.length; i++) {
    sum1 = (sum1 + bytes[i]) % mod;
    sum2 = (sum2 + sum1) % mod;
  }
  const result = ((sum2 << 8) | sum1) & 0xffff;
  return `=== Fletcher16 校验和 ===\n\n模数: ${mod}\n数据长度: ${bytes.length} 字节\nFletcher16: 0x${result.toString(16).padStart(4, '0').toUpperCase()}\nFletcher16 (十进制): ${result}\n`;
}

function calcFletcher32(bytes: Uint8Array): string {
  let sum1 = 0;
  let sum2 = 0;
  const mod = 65535;
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const word = (bytes[i] << 8) | bytes[i + 1];
    sum1 = (sum1 + word) % mod;
    sum2 = (sum2 + sum1) % mod;
  }
  if (bytes.length % 2 !== 0) {
    const word = bytes[bytes.length - 1] << 8;
    sum1 = (sum1 + word) % mod;
    sum2 = (sum2 + sum1) % mod;
  }
  const result = ((sum2 << 16) | sum1) >>> 0;
  return `=== Fletcher32 校验和 ===\n\n模数: ${mod}\n数据长度: ${bytes.length} 字节\nFletcher32: 0x${result.toString(16).padStart(8, '0').toUpperCase()}\nFletcher32 (十进制): ${result}\n`;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="协议校验和计算"
    paramsConfig={[
      {
        name: 'type',
        label: '校验类型',
        type: 'select',
        default: 'ipv4-header',
        options: [
          { value: 'ipv4-header', label: 'IPv4 头部校验和' },
          { value: 'tcp-udp', label: 'TCP/UDP 校验和 (含伪头部)' },
          { value: 'icmp', label: 'ICMP 校验和' },
          { value: 'crc32', label: 'CRC32' },
          { value: 'adler32', label: 'Adler32' },
          { value: 'fletcher16', label: 'Fletcher16' },
          { value: 'fletcher32', label: 'Fletcher32' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const type = (params.type as string) || 'ipv4-header';
      const bytes = parseHex(input);

      switch (type) {
        case 'ipv4-header':
          return calcIPv4Checksum(bytes);
        case 'tcp-udp':
          return calcTcpUdpChecksum(bytes);
        case 'icmp':
          return calcIcmpChecksum(bytes);
        case 'crc32':
          return calcCRC32(bytes);
        case 'adler32':
          return calcAdler32(bytes);
        case 'fletcher16':
          return calcFletcher16(bytes);
        case 'fletcher32':
          return calcFletcher32(bytes);
        default:
          throw new Error(`未知校验类型: ${type}`);
      }
    }}
  />
);

export default ToolComponent;
