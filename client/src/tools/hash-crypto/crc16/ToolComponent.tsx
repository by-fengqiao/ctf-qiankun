import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const computeCRC16CCITT = (data: Uint8Array): number => {
  let crc = 0xffff;
  const polynomial = 0x1021;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i] << 8) & 0xffff;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      const crc = computeCRC16CCITT(bytes);
      return crc.toString(16).padStart(4, '0').toUpperCase();
    }}
  />
);
export default ToolComponent;
