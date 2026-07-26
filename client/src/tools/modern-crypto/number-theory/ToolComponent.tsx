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

const extGcd = (a: bigint, b: bigint): [bigint, bigint, bigint] => {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = extGcd(b, a % b);
  return [g, y, x - (a / b) * y];
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

const modInv = (a: bigint, m: bigint): bigint => {
  const [g, x] = extGcd(((a % m) + m) % m, m);
  if (g !== 1n) throw new Error('模逆不存在');
  return ((x % m) + m) % m;
};

const millerRabin = (n: bigint): boolean => {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d = d / 2n;
    r++;
  }
  const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const a of witnesses) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let found = false;
    for (let i = 0n; i < r - 1n; i++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
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

const eulerTotient = (n: bigint): bigint => {
  let result = n;
  let m = n;
  for (let p = 2n; p * p <= m; p++) {
    if (m % p === 0n) {
      while (m % p === 0n) m = m / p;
      result = result - result / p;
    }
  }
  if (m > 1n) result = result - result / m;
  return result;
};

const smallestPrimitiveRoot = (p: bigint): bigint => {
  if (p < 2n) throw new Error('p 必须 ≥ 2');
  if (p === 2n) return 1n;
  const phi = p - 1n;
  const factors: bigint[] = [];
  let m = phi;
  for (let f = 2n; f * f <= m; f++) {
    if (m % f === 0n) {
      factors.push(f);
      while (m % f === 0n) m = m / f;
    }
  }
  if (m > 1n) factors.push(m);
  for (let g = 2n; g < p; g++) {
    let isPrimitive = true;
    for (const f of factors) {
      if (modPow(g, phi / f, p) === 1n) {
        isPrimitive = false;
        break;
      }
    }
    if (isPrimitive) return g;
  }
  throw new Error('未找到原根');
};

const bsgs = (g: bigint, h: bigint, p: bigint): bigint => {
  if (p >= 1000000n) throw new Error('p 过大 (>10^6)，BSGS 不支持');
  const m = isqrtBig(p) + 1n;
  const table = new Map<bigint, bigint>();
  let curr = 1n;
  for (let j = 0n; j < m; j++) {
    if (!table.has(curr)) table.set(curr, j);
    curr = (curr * g) % p;
  }
  const factor = modInv(modPow(g, m, p), p);
  let gamma = h % p;
  for (let i = 0n; i <= m; i++) {
    const j = table.get(gamma);
    if (j !== undefined) {
      const x = i * m + j;
      if (modPow(g, x, p) === h % p) return x;
    }
    gamma = (gamma * factor) % p;
  }
  throw new Error('离散对数无解');
};

const isqrtBig = (n: bigint): bigint => {
  if (n < 0n) throw new Error('负数');
  if (n < 2n) return n;
  let lo = 1n;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if (mid * mid < n) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
};

const crt = (pairs: { r: bigint; m: bigint }[]): bigint => {
  let R = 0n;
  let M = 1n;
  for (const { r, m } of pairs) {
    const [g, x] = extGcd(M, m);
    if ((r - R) % g !== 0n) throw new Error('CRT 无解');
    const lcm = M / g * m;
    R = (R + M * x * ((r - R) / g)) % lcm;
    R = ((R % lcm) + lcm) % lcm;
    M = lcm;
  }
  return R;
};

const execute = (input: string, mode: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  switch (mode) {
    case 'gcd': {
      const parts = lines[0].split(/\s+/);
      const a = BigInt(parts[0]);
      const b = BigInt(parts[1]);
      return `gcd(${a}, ${b}) = ${bigGcd(a, b)}`;
    }
    case 'egcd': {
      const parts = lines[0].split(/\s+/);
      const a = BigInt(parts[0]);
      const b = BigInt(parts[1]);
      const [g, x, y] = extGcd(a, b);
      return `egcd(${a}, ${b}):\ng = ${g}\nx = ${x}\ny = ${y}\n验证: a*x + b*y = ${a * x + b * y}`;
    }
    case 'modinv': {
      const parts = lines[0].split(/\s+/);
      const a = BigInt(parts[0]);
      const m = BigInt(parts[1]);
      const inv = modInv(a, m);
      return `a^(-1) mod m = ${inv}\n验证: a * inv mod m = ${(a * inv) % m}`;
    }
    case 'crt': {
      const pairs = lines.map((l) => {
        const parts = l.split(/\s+/);
        return { r: BigInt(parts[0]), m: BigInt(parts[1]) };
      });
      const result = crt(pairs);
      const M = pairs.reduce((acc, p) => acc * p.m, 1n);
      const checks = pairs.map((p, i) => `x mod m${i + 1} = ${result % p.m} (期望 ${p.r}) ✓`);
      return `CRT 解: x = ${result}\n模数积 M = ${M}\n${checks.join('\n')}`;
    }
    case 'powmod': {
      const parts = lines[0].split(/\s+/);
      const base = BigInt(parts[0]);
      const exp = BigInt(parts[1]);
      const mod = BigInt(parts[2]);
      return `${base}^${exp} mod ${mod} = ${modPow(base, exp, mod)}`;
    }
    case 'primitive-root': {
      const p = BigInt(lines[0]);
      const g = smallestPrimitiveRoot(p);
      return `模 ${p} 的最小原根: ${g}\nphi(${p}) = ${p - 1n}`;
    }
    case 'discrete-log': {
      const parts = lines[0].split(/\s+/);
      const g = BigInt(parts[0]);
      const h = BigInt(parts[1]);
      const p = BigInt(parts[2]);
      const x = bsgs(g, h, p);
      return `离散对数 x = ${x}\n验证: ${g}^${x} mod ${p} = ${modPow(g, x, p)} (期望 ${h % p})`;
    }
    case 'euler': {
      const n = BigInt(lines[0]);
      return `phi(${n}) = ${eulerTotient(n)}`;
    }
    case 'miller-rabin': {
      const n = BigInt(lines[0]);
      return `${n} ${millerRabin(n) ? '是' : '不是'}素数`;
    }
    case 'pollard-rho': {
      const n = BigInt(lines[0]);
      const d = pollardRho(n);
      if (d === 0n || d === n) return `${n} 未找到非平凡因子`;
      return `${n} 的一个因子: ${d}\n余数: ${n / d}`;
    }
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="数论计算器"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'gcd')
    }
    modeOptions={[
      { value: 'gcd', label: 'GCD' },
      { value: 'egcd', label: '扩展GCD' },
      { value: 'modinv', label: '模逆' },
      { value: 'crt', label: 'CRT' },
      { value: 'powmod', label: '模幂' },
      { value: 'primitive-root', label: '原根' },
      { value: 'discrete-log', label: '离散对数' },
      { value: 'euler', label: '欧拉函数' },
      { value: 'miller-rabin', label: '素性检测' },
      { value: 'pollard-rho', label: 'Pollard-Rho' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'gcd', options: [
        { value: 'gcd', label: 'GCD' },
        { value: 'egcd', label: '扩展GCD' },
        { value: 'modinv', label: '模逆' },
        { value: 'crt', label: 'CRT' },
        { value: 'powmod', label: '模幂' },
        { value: 'primitive-root', label: '原根' },
        { value: 'discrete-log', label: '离散对数' },
        { value: 'euler', label: '欧拉函数' },
        { value: 'miller-rabin', label: '素性检测' },
        { value: 'pollard-rho', label: 'Pollard-Rho' },
      ] },
    ]}
  />
);

export default ToolComponent;
