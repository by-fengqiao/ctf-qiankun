import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const computeFletcher32 = (data: Uint8Array): number => {
  const words: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const lo = data[i];
    const hi = i + 1 < data.length ? data[i + 1] : 0;
    words.push((hi << 8) | lo);
  }
  let sum1 = 0;
  let sum2 = 0;
  const mod = 65535;
  for (let i = 0; i < words.length; i++) {
    sum1 = (sum1 + words[i]) % mod;
    sum2 = (sum2 + sum1) % mod;
  }
  return ((sum2 << 16) | sum1) >>> 0;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      const fletcher = computeFletcher32(bytes);
      return fletcher.toString(16).padStart(8, '0').toUpperCase();
    }}
  />
);
export default ToolComponent;
