import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  if (mod === 1n) return 0n;
  let r = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) r = (r * base) % mod;
    exp /= 2n;
    base = (base * base) % mod;
  }
  return r;
};

const parseBig = (s: string): bigint => {
  const t = s.trim();
  if (t.startsWith('0x') || t.startsWith('0X')) return BigInt(t);
  if (/^\d+$/.test(t)) return BigInt(t);
  return BigInt(t);
};

const toText = (n: bigint): string => {
  const hex = n.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(parseInt(padded.slice(i, i + 2), 16));
  }
  return String.fromCharCode(...bytes);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="rsa-oracle"
    modeOptions={[
      { value: 'parity', label: '奇偶性' },
      { value: 'lsb', label: 'LSB' },
      { value: 'homomorphic', label: '同态' },
    ]}
    paramsConfig={[
      { name: 'bit', label: 'Oracle位', type: 'select', options: [
        { value: '0', label: '0' },
        { value: '1', label: '1' },
      ], default: '0' },
      { name: 'bound', label: '当前范围', type: 'text', placeholder: '留空自动初始化', default: '' },
    ]}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const lines = input.trim().split('\n').filter((l: string) => l.trim());
      if (lines.length < 3) throw new Error('需要3行: n, e, c');
      const n = parseBig(lines[0]);
      const e = parseBig(lines[1]);
      const c = parseBig(lines[2]);

      if (mode === 'homomorphic') {
        const s = lines[3] ? parseBig(lines[3]) : 2n;
        const sE = modPow(s, e, n);
        const cPrime = (c * sE) % n;
        return [
          '=== RSA 同态性质 ===',
          '',
          `s = ${s}`,
          `s^e mod n = 0x${sE.toString(16)}`,
          `c' = c * s^e mod n = 0x${cPrime.toString(16)}`,
          '',
          `解密关系: D(c') = m * s mod n`,
          `如果知道 D(c')，则 m = D(c') * s^(-1) mod n`,
          '',
          `s^(-1) mod n = 0x${(() => {
            const [g, x] = (() => {
              let a = s, b = n;
              let oldR = a, r = b, oldS = 1n, s2 = 0n;
              while (r !== 0n) {
                const q = oldR / r;
                [oldR, r] = [r, oldR - q * r];
                [oldS, s2] = [s2, oldS - q * s2];
              }
              return [oldR, oldS];
            })();
            return g === 1n ? ((x % n) + n) % n : 0n;
          })().toString(16)}`,
        ].join('\n');
      }

      const bit = params.bit as string;
      const bitVal = BigInt(bit || '0');
      const boundStr = params.bound as string;

      let lo: bigint;
      let hi: bigint;

      if (boundStr && boundStr.includes(',')) {
        const parts = boundStr.split(',').map((p: string) => p.trim());
        lo = parseBig(parts[0]);
        hi = parseBig(parts[1]);
      } else {
        lo = 0n;
        hi = n;
      }

      const twoE = modPow(2n, e, n);
      const cDoubled = (c * twoE) % n;

      if (mode === 'parity') {
        if (bitVal === 0n) {
          const mid = (lo + hi) / 2n;
          hi = mid;
        } else {
          const mid = (lo + hi) / 2n + 1n;
          lo = mid;
        }

        return [
          `=== RSA Parity Oracle (步骤) ===`,
          '',
          `Oracle 返回: ${bitVal === 0n ? '偶数 (m < n/2)' : '奇数 (m >= n/2)'}`,
          '',
          `c' = c * 2^e mod n = 0x${cDoubled.toString(16)}`,
          '',
          `当前明文范围:`,
          `  下界: ${lo.toString()}`,
          `  上界: ${hi.toString()}`,
          `  范围大小: ${(hi - lo).toString()}`,
          '',
          hi - lo < 2n
            ? `明文恢复: ${lo.toString()}`
            : `请将 c' 发送给 Oracle，设置 bit=0/1, bound=${lo},${hi}`,
        ].join('\n');
      }

      const sInv = (() => {
        let a = 2n, b = n;
        let oldR = a, r = b, oldS = 1n, s2 = 0n;
        while (r !== 0n) {
          const q = oldR / r;
          [oldR, r] = [r, oldR - q * r];
          [oldS, s2] = [s2, oldS - q * s2];
        }
        return oldR === 1n ? ((oldS % n) + n) % n : 0n;
      })();

      if (mode === 'lsb') {
        const newBit = bitVal === 0n ? 0n : 1n;
        lo = lo * 2n + newBit;
        hi = hi * 2n + newBit;

        if (hi > n) {
          lo = lo - n;
          hi = hi - n;
        }

        const cNext = (cDoubled * sInv) % n;

        return [
          `=== RSA LSB Oracle (步骤) ===`,
          '',
          `Oracle 返回 LSB: ${bitVal}`,
          `明文最低位: ${newBit}`,
          '',
          `c' = c * 2^e * (2^-1)^e mod n = 0x${cNext.toString(16)}`,
          '',
          `当前明文范围:`,
          `  下界: ${lo.toString()}`,
          `  上界: ${hi.toString()}`,
          `  范围大小: ${(hi - lo).toString()}`,
          '',
          hi - lo < 2n
            ? `明文恢复: ${lo.toString()}\n明文(hex): 0x${lo.toString(16)}\n明文(text): ${toText(lo)}`
            : `请将 c' 发送给 Oracle，设置 bit=0/1, bound=${lo},${hi}`,
        ].join('\n');
      }

      return '请选择模式 (parity/lsb/homomorphic)';
    }}
  />
);

export default ToolComponent;
