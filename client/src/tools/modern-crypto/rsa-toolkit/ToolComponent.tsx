import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const bigGcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b > 0n) {
    [a, b] = [b, a % b];
  }
  return a;
};

const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
};

const extGcd = (a: bigint, b: bigint): [bigint, bigint, bigint] => {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = extGcd(b, a % b);
  return [g, y, x - (a / b) * y];
};

const modInv = (a: bigint, m: bigint): bigint => {
  const [g, x] = extGcd(((a % m) + m) % m, m);
  if (g !== 1n) throw new Error('模逆不存在');
  return ((x % m) + m) % m;
};

const pollardRho = (n: bigint): bigint => {
  if (n % 2n === 0n) return 2n;
  let x = 2n;
  let y = 2n;
  let d = 1n;
  const f = (v: bigint): bigint => (v * v + 1n) % n;
  let count = 0;
  while (d === 1n && count < 100000) {
    x = f(x);
    y = f(f(y));
    d = bigGcd(x > y ? x - y : y - x, n);
    count++;
  }
  return d === n ? 0n : d;
};

const isqrt = (x: bigint): bigint => {
  if (x < 0n) throw new Error('负数不能开方');
  if (x < 2n) return x;
  let lo = 1n;
  let hi = x;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if (mid * mid < x) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
};

const hexToStr = (hex: string): string => {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '(非UTF-8)';
  }
};

const factorN = (n: bigint): string => {
  const factors: bigint[] = [];
  let m = n;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    while (m % p === 0n) {
      factors.push(p);
      m = m / p;
    }
  }
  let attempts = 0;
  while (m > 1n && attempts < 10000) {
    if (m < 1000000n) {
      let p = 41n;
      while (p * p <= m) {
        if (m % p === 0n) {
          factors.push(p);
          m = m / p;
        } else {
          p += 2n;
        }
      }
      if (m > 1n) {
        factors.push(m);
        m = 1n;
      }
    } else {
      const d = pollardRho(m);
      if (d === 0n || d === m) {
        factors.push(m);
        break;
      }
      factors.push(d);
      m = m / d;
    }
    attempts++;
  }
  const lines: string[] = [`n = ${n}`, `因数: ${factors.join(' × ')}`];
  const unique = [...new Set(factors)];
  if (unique.length >= 2) {
    const p = unique[0];
    const q = n / p;
    lines.push(`p = ${p}`);
    lines.push(`q = ${q}`);
    lines.push(`phi(n) = ${(p - 1n) * (q - 1n)}`);
  }
  return lines.join('\n');
};

const commonModulus = (lines: string[]): string => {
  const n = BigInt(lines[0].trim());
  const e1 = BigInt(lines[1].trim());
  const e2 = BigInt(lines[2].trim());
  const c1 = BigInt(lines[3].trim());
  const c2 = BigInt(lines[4].trim());
  const [g, s1, s2] = extGcd(e1, e2);
  if (g !== 1n) throw new Error('gcd(e1,e2) ≠ 1，共模攻击失败');
  let m: bigint;
  const c1s1 = s1 >= 0n
    ? modPow(c1, s1, n)
    : modPow(modInv(c1, n), -s1, n);
  const c2s2 = s2 >= 0n
    ? modPow(c2, s2, n)
    : modPow(modInv(c2, n), -s2, n);
  m = (c1s1 * c2s2) % n;
  return [
    `n = ${n}`,
    `e1 = ${e1}, e2 = ${e2}`,
    `c1 = ${c1}, c2 = ${c2}`,
    `gcd(e1, e2) = ${g}`,
    `s1 = ${s1}, s2 = ${s2}`,
    `验证: e1*s1 + e2*s2 = ${e1 * s1 + e2 * s2}`,
    `m = c1^s1 * c2^s2 mod n = ${m}`,
  ].join('\n');
};

const broadcast = (lines: string[]): string => {
  const pairs: { n: bigint; c: bigint }[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    pairs.push({ n: BigInt(lines[i].trim()), c: BigInt(lines[i + 1].trim()) });
  }
  if (pairs.length < 3) throw new Error('广播攻击需要至少3组 (n_i, c_i)');
  const N = pairs.reduce((acc, p) => acc * p.n, 1n);
  let M = 0n;
  for (const p of pairs) {
    const Ni = N / p.n;
    const ni = modInv(Ni, p.n);
    M = (M + p.c * Ni * ni) % N;
  }
  const m = isqrt(isqrt(M));
  const result: string[] = [
    `CRT 合并结果 M = ${M}`,
    `立方根 m = ${m}`,
    `验证 m³ mod N = ${modPow(m, 3n, N)}`,
    `明文 m = ${m}`,
  ];
  const hex = m.toString(16);
  result.push(`明文 hex = ${hex}`);
  result.push(`明文 ascii = ${hexToStr(hex)}`);
  return result.join('\n');
};

const wiener = (lines: string[]): string => {
  const n = BigInt(lines[0].trim());
  const e = BigInt(lines[1].trim());
  const cf: bigint[] = [];
  let num = e;
  let den = n;
  while (den !== 0n) {
    cf.push(num / den);
    [num, den] = [den, num % den];
  }
  let h_prev = 1n;
  let h_curr = 0n;
  let k_prev = 0n;
  let k_curr = 1n;
  for (const a of cf) {
    const h = a * h_prev + h_curr;
    const k = a * k_prev + k_curr;
    if (k !== 0n) {
      if ((e * k - 1n) % h === 0n) {
        const phi = (e * k - 1n) / h;
        const b = n - phi + 1n;
        const disc = b * b - 4n * n;
        if (disc >= 0n) {
          const sq = isqrt(disc);
          if (sq * sq === disc) {
            const p = (b + sq) / 2n;
            const q = (b - sq) / 2n;
            if (p * q === n) {
              return [
                `Wiener 攻击成功!`,
                `d = ${k}`,
                `p = ${p}`,
                `q = ${q}`,
                `phi(n) = ${phi}`,
                `验证: d*e mod phi = ${(k * e) % phi}`,
              ].join('\n');
            }
          }
        }
      }
    }
    h_curr = h_prev;
    h_prev = h;
    k_curr = k_prev;
    k_prev = k;
  }
  return 'Wiener 攻击失败：未找到合适的 d';
};

const keygen = (lines: string[]): string => {
  const p = BigInt(lines[0].trim());
  const q = BigInt(lines[1].trim());
  const e = BigInt(lines[2].trim());
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const d = modInv(e, phi);
  return [
    `p = ${p}`,
    `q = ${q}`,
    `n = p * q = ${n}`,
    `phi(n) = (p-1)(q-1) = ${phi}`,
    `e = ${e}`,
    `d = e^(-1) mod phi(n) = ${d}`,
    `验证: e*d mod phi = ${(e * d) % phi}`,
    `公钥: (n=${n}, e=${e})`,
    `私钥: (n=${n}, d=${d})`,
  ].join('\n');
};

const execute = (input: string, mode: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  switch (mode) {
    case 'factor':
      return factorN(BigInt(lines[0].trim()));
    case 'common-modulus':
      return commonModulus(lines);
    case 'broadcast':
      return broadcast(lines);
    case 'wiener':
      return wiener(lines);
    case 'keygen':
      return keygen(lines);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="RSA综合工具"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'factor')
    }
    modeOptions={[
      { value: 'factor', label: '小n分解' },
      { value: 'common-modulus', label: '共模攻击' },
      { value: 'broadcast', label: 'e=3广播' },
      { value: 'wiener', label: 'Wiener攻击' },
      { value: 'keygen', label: '已知p,q求d' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'factor', options: [
        { value: 'factor', label: '小n分解' },
        { value: 'common-modulus', label: '共模攻击' },
        { value: 'broadcast', label: 'e=3广播' },
        { value: 'wiener', label: 'Wiener攻击' },
        { value: 'keygen', label: '已知p,q求d' },
      ] },
    ]}
  />
);

export default ToolComponent;
