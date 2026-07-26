import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// DNA encoding: each byte -> 4 DNA bases (2 bits per base)
// 00=A, 01=C, 10=G, 11=T
const BITS_TO_DNA: string[] = ['A', 'C', 'G', 'T'];
const DNA_TO_BITS: Record<string, string> = { A: '00', C: '01', G: '10', T: '11' };

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);

const encode = (input: string): string => {
  const bytes = strToBytes(input);
  const result: string[] = [];
  for (const byte of bytes) {
    for (let i = 6; i >= 0; i -= 2) {
      const bits = (byte >> i) & 0x03;
      result.push(BITS_TO_DNA[bits]);
    }
  }
  return result.join('');
};

const decode = (input: string): string => {
  const cleaned = input.toUpperCase().replace(/[^ACGT]/g, '');
  if (cleaned.length % 4 !== 0) return '错误: DNA序列长度必须是4的倍数';
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    let byte = 0;
    for (let j = 0; j < 4; j++) {
      const bits = DNA_TO_BITS[cleaned[i + j]];
      if (!bits) return '错误: 无效的DNA碱基';
      byte = (byte << 2) | parseInt(bits, 2);
    }
    bytes.push(byte);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) =>
      mode === 'encode' ? encode(input) : decode(input)
    }
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
