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
      let ip: string;
      let cidr: number;
      if (slashIdx !== -1) {
        ip = trimmed.slice(0, slashIdx).trim();
        cidr = parseInt(trimmed.slice(slashIdx + 1), 10);
      } else {
        ip = trimmed;
        cidr = 24;
      }
      if (cidr < 0 || cidr > 32) {
        throw new Error('CIDR 前缀长度应在 0-32 之间');
      }
      const ipInt = ipToInt(ip);
      const mask = maskFromCidr(cidr);
      const network = (ipInt & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const wildcard = (~mask >>> 0) >>> 0;
      const hostMin = cidr === 32 ? network : (network + 1) >>> 0;
      const hostMax = cidr === 32 ? network : (broadcast - 1) >>> 0;
      const totalHosts = cidr >= 31 ? (1 << (32 - cidr)) >>> 0 : (1 << (32 - cidr)) >>> 0;
      const usableHosts = cidr === 32 ? 1 : Math.max(0, totalHosts - 2);
      const maskBinary = mask.toString(2).padStart(32, '0').match(/.{8}/g)?.join('.') ?? '';
      const wildcardBinary = wildcard.toString(2).padStart(32, '0').match(/.{8}/g)?.join('.') ?? '';
      const classType =
        cidr === 32 ? '单机' : cidr === 31 ? '点对点' : cidr === 30 ? '/30 子网' : cidr <= 8 ? 'A 类' : cidr <= 16 ? 'B 类' : cidr <= 24 ? 'C 类' : '子网';
      return [
        `地址: ${intToIp(ipInt)}/${cidr}`,
        `子网掩码: ${intToIp(mask)}`,
        `掩码(二进制): ${maskBinary}`,
        `通配符掩码: ${intToIp(wildcard)}`,
        `通配符(二进制): ${wildcardBinary}`,
        `网络地址: ${intToIp(network)}`,
        `广播地址: ${intToIp(broadcast)}`,
        `主机范围: ${intToIp(hostMin)} - ${intToIp(hostMax)}`,
        `总地址数: ${totalHosts}`,
        `可用主机数: ${usableHosts}`,
        `CIDR 类型: ${classType}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
