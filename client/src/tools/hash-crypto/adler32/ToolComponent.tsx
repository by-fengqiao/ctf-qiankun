import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const computeAdler32 = (data: Uint8Array): number => {
  let a = 1;
  let b = 0;
  const mod = 65521;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % mod;
    b = (b + a) % mod;
  }
  return ((b << 16) | a) >>> 0;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      const adler = computeAdler32(bytes);
      return adler.toString(16).padStart(8, '0').toUpperCase();
    }}
  />
);
export default ToolComponent;
