import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ipToInt = (ip: string): number => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error('无效的 IPv4 地址');
  }
  return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
};

const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff,
  ].join('.');
};

const maskFromCidr = (cidr: number): number => {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      const slashIdx = trimmed.indexOf('/');
      if (slashIdx === -1) {
        throw new Error('请输入 CIDR 格式，如 10.0.0.0/16');
      }
      const ip = trimmed.slice(0, slashIdx).trim();
      const cidr = parseInt(trimmed.slice(slashIdx + 1), 10);
      if (cidr < 0 || cidr > 32) {
        throw new Error('CIDR 应在 0-32 之间');
      }
      const ipInt = ipToInt(ip);
      const mask = maskFromCidr(cidr);
      const network = (ipInt & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const hostBits = 32 - cidr;
      const totalAddrs = hostBits >= 31 ? 0 : (1 << hostBits) >>> 0;
      const usableHosts = cidr >= 31 ? totalAddrs || (cidr === 31 ? 2 : 1) : Math.max(0, (1 << hostBits) - 2);
      const maskParts = intToIp(mask).split('.').map(Number);
      const isClassA = cidr <= 8;
      const isClassB = cidr > 8 && cidr <= 16;
      const isClassC = cidr > 16 && cidr <= 24;
      const subnetClass = isClassA ? 'A' : isClassB ? 'B' : isClassC ? 'C' : '子网划分';
      return [
        `CIDR: ${intToIp(ipInt)}/${cidr}`,
        `子网掩码: ${intToIp(mask)} (${cidr} 位)`,
        `网络地址: ${intToIp(network)}`,
        `广播地址: ${intToIp(broadcast)}`,
        `第一个主机: ${intToIp((network + 1) >>> 0)}`,
        `最后一个主机: ${intToIp((broadcast - 1) >>> 0)}`,
        `总地址数: ${totalAddrs}`,
        `可用主机数: ${usableHosts}`,
        `掩码最大值: ${maskParts.join('.')}`,
        `网络类别: ${subnetClass}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
