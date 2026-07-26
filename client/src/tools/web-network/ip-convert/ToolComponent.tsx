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

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      let intVal: number;
      if (/^\d+$/.test(trimmed)) {
        intVal = Number(trimmed) >>> 0;
      } else if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length <= 8) {
        intVal = parseInt(trimmed, 16) >>> 0;
      } else if (/^[01]+$/.test(trimmed) && trimmed.length === 32) {
        intVal = parseInt(trimmed, 2) >>> 0;
      } else {
        intVal = ipToInt(trimmed);
      }
      const ip = intToIp(intVal);
      const binary = intVal.toString(2).padStart(32, '0');
      const hex = intVal.toString(16).toUpperCase().padStart(8, '0');
      const binaryGrouped = binary.match(/.{8}/g)?.join('.') ?? binary;
      return [
        `点分十进制: ${ip}`,
        `十进制整数: ${intVal}`,
        `十六进制: 0x${hex}`,
        `二进制: ${binaryGrouped}`,
        `八进制: 0${intVal.toString(8)}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
