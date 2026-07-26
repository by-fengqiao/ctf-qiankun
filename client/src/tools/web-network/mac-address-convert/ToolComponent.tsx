import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const parseMAC = (input: string): string => {
  const cleaned = input.replace(/[.:\- ]/g, '').toUpperCase();
  if (!/^[0-9A-F]{12}$/.test(cleaned)) {
    throw new Error('无效的 MAC 地址（需要 12 个十六进制字符）');
  }
  return cleaned;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const hex = parseMAC(input);
      const colon = hex.match(/.{2}/g)?.join(':') ?? '';
      const hyphen = hex.match(/.{2}/g)?.join('-') ?? '';
      const dot = hex.match(/.{4}/g)?.join('.') ?? '';
      const none = hex;
      const oui = hex.slice(0, 6);
      const nic = hex.slice(6);
      const firstByte = parseInt(hex.slice(0, 2), 16);
      const isMulticast = (firstByte & 0x01) === 1;
      const isLocallyAdmin = (firstByte & 0x02) === 2;
      return [
        `冒号分隔: ${colon}`,
        `连字符分隔: ${hyphen}`,
        `点号分隔: ${dot}`,
        `无分隔符: ${none}`,
        ``,
        `OUI (厂商标识): ${oui}`,
        `NIC (网卡标识): ${nic}`,
        `组播地址: ${isMulticast ? '是' : '否'}`,
        `本地管理: ${isLocallyAdmin ? '是' : '否 (全局唯一)'}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
