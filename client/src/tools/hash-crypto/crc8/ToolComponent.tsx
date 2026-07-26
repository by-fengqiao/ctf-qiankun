import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const computeCRC8 = (data: Uint8Array): number => {
  let crc = 0x00;
  const polynomial = 0x07;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xff;
      } else {
        crc = (crc << 1) & 0xff;
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
      const crc = computeCRC8(bytes);
      return crc.toString(16).padStart(2, '0').toUpperCase();
    }}
  />
);
export default ToolComponent;
