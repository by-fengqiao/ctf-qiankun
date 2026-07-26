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

const modPow = (b: bigint, e: bigint, m: bigint): bigint => {
  if (m === 1n) return 0n;
  let r = 1n;
  b = ((b % m) + m) % m;
  while (e > 0n) {
    if (e % 2n === 1n) r = (r * b) % m;
    e /= 2n;
    b = (b * b) % m;
  }
  return r;
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

const millerRabin = (n: bigint, rounds: number = 20): boolean => {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }
  const witnesses: bigint[] = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  const limit = Math.min(rounds, witnesses.length);
  for (let i = 0; i < limit; i++) {
    const a = witnesses[i];
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let j = 0n; j < r - 1n; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
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

const factorize = (n: bigint): [bigint, bigint][] => {
  const factors: [bigint, bigint][] = [];
  let m = n;
  for (let p = 2n; p * p <= m && p < 1000000n; p++) {
    if (m % p === 0n) {
      let e = 0n;
      while (m % p === 0n) {
        m /= p;
        e++;
      }
      factors.push([p, e]);
    }
  }
  if (m > 1n) {
    if (millerRabin(m)) {
      factors.push([m, 1n]);
    } else {
      const d = pollardRho(m);
      if (d > 1n && d < m) {
        factors.push([d, 1n]);
        factors.push([m / d, 1n]);
      } else {
        factors.push([m, 1n]);
      }
    }
  }
  return factors;
};

const BSGS_LIMIT = 2000000n;

const bsgs = (g: bigint, h: bigint, p: bigint, order: bigint): bigint => {
  const m = isqrt(order) + 1n;
  if (m > BSGS_LIMIT) {
    throw new Error(
      `子群阶过大 (${order.toString()}), BSGS需 ${m.toString()} 步, 超过限制`,
    );
  }
  const table = new Map<bigint, bigint>();
  let cur = 1n;
  for (let i = 0n; i < m; i++) {
    if (!table.has(cur)) table.set(cur, i);
    cur = (cur * g) % p;
  }
  const gm = modPow(g, m, p);
  const gmInv = modInv(gm, p);
  let gamma = h % p;
  for (let j = 0n; j < m; j++) {
    const val = table.get(gamma);
    if (val !== undefined) return j * m + val;
    gamma = (gamma * gmInv) % p;
  }
  return -1n;
};

const orderOf = (g: bigint, p: bigint): bigint => {
  const n = p - 1n;
  const factors = factorize(n);
  let order = n;
  for (const [q] of factors) {
    while (order % q === 0n && modPow(g, order / q, p) === 1n) {
      order /= q;
    }
  }
  return order;
};

const pohligHellman = (g: bigint, h: bigint, p: bigint): bigint => {
  const n = p - 1n;
  const factors = factorize(n);
  const residues: bigint[] = [];
  const moduli: bigint[] = [];

  for (const [q, e] of factors) {
    let qe = 1n;
    for (let i = 0n; i < e; i++) qe *= q;

    const gq = modPow(g, n / qe, p);
    const hq = modPow(h, n / qe, p);

    let x = 0n;
    let qPow = 1n;
    const g0 = modPow(gq, qe / q, p);

    for (let k = 0n; k < e; k++) {
      const exp = qe / (qPow * q);
      const gi = modPow(gq, x, p);
      const hk = modPow((hq * modInv(gi, p)) % p, exp, p);
      const dk = bsgs(g0, hk, p, q);
      if (dk === -1n) throw new Error(`子群 ${q}^${e} 的DLP求解失败`);
      x += dk * qPow;
      qPow *= q;
    }

    residues.push(x);
    moduli.push(qe);
  }

  let result = 0n;
  let M = 1n;
  for (const mod of moduli) M *= mod;
  for (let i = 0; i < residues.length; i++) {
    const Mi = M / moduli[i];
    const yi = modInv(Mi, moduli[i]);
    result = (result + residues[i] * Mi * yi) % M;
  }
  return result;
};

const parseBigInt = (s: string): bigint => BigInt(s.trim());

const smallGroupAttack = (lines: string[]): string => {
  if (lines.length < 3) throw new Error('需要3行: p, g, h');
  const p = parseBigInt(lines[0]);
  const g = parseBigInt(lines[1]);
  const h = parseBigInt(lines[2]);

  const result: string[] = ['=== Pohlig-Hellman 小群攻击 ===', ''];

  const isPrime = millerRabin(p);
  if (!isPrime) {
    result.push('⚠️ p 不是素数, 攻击结果可能不正确');
    result.push('');
  }

  const factors = factorize(p - 1n);
  result.push('p - 1 的因式分解:');
  const factorStr = factors
    .map(([q, e]: [bigint, bigint]) => (e === 1n ? `${q}` : `${q}^${e}`))
    .join(' × ');
  result.push(`  ${factorStr}`);
  result.push('');

  const maxFactor = factors.reduce(
    (max: bigint, [q]: [bigint, bigint]) => (q > max ? q : max),
    0n,
  );
  const maxBits = maxFactor.toString(2).length;
  result.push(`最大素因子: ${maxFactor} (${maxBits} bits)`);
  if (maxBits > 40) {
    result.push('⚠️ 最大因子过大, BSGS可能较慢或失败');
  }
  result.push('');

  const x = pohligHellman(g, h, p);

  result.push(`离散对数 x = ${x}`);
  result.push(`验证: g^x mod p = ${modPow(g, x, p)}`);
  result.push(`目标: h       = ${h}`);
  result.push(`结果: ${modPow(g, x, p) === h ? '✓ 成功' : '✗ 失败'}`);

  return result.join('\n');
};

const paramCheck = (lines: string[]): string => {
  if (lines.length < 2) throw new Error('需要2行: p, g');
  const p = parseBigInt(lines[0]);
  const g = parseBigInt(lines[1]);

  const result: string[] = ['=== DH 参数检查 ===', ''];

  const isPrime = millerRabin(p);
  result.push(`p 是否为素数: ${isPrime ? '✓ 是' : '✗ 否'}`);
  result.push('');

  const pBits = p.toString(2).length;
  result.push(`p 位数: ${pBits} bits`);
  if (pBits < 1024) {
    result.push('🔴 p 极不安全 (< 1024 bits)');
  } else if (pBits < 2048) {
    result.push('⚠️ p 过小 (< 2048 bits), 不安全');
  }
  result.push('');

  const order = orderOf(g, p);
  result.push(`g 的阶: ${order}`);
  result.push(`g 的阶位数: ${order.toString(2).length} bits`);

  if (order === p - 1n) {
    result.push('✓ g 是生成元 (阶 = p-1)');
  } else if (order === (p - 1n) / 2n) {
    result.push('⚠ g 的阶 = (p-1)/2 (可能是二次剩余子群)');
  } else {
    result.push('⚠ g 的阶 < p-1, 存在真子群');
  }
  result.push('');

  const orderFactors = factorize(order);
  result.push('g 阶的因式分解:');
  const factorStr = orderFactors
    .map(([q, e]: [bigint, bigint]) => (e === 1n ? `${q}` : `${q}^${e}`))
    .join(' × ');
  result.push(`  ${factorStr}`);

  const smallFactors = orderFactors.filter(
    ([q]: [bigint, bigint]) => q < 2n ** 64n,
  );
  if (smallFactors.length > 0) {
    result.push('');
    result.push('⚠️ 发现小素因子:');
    for (const [q] of smallFactors) {
      result.push(`  ${q} (${q.toString(2).length} bits)`);
    }
    result.push('  这些小子群可被用于小群攻击');
  }

  result.push('');
  result.push('=== 安全评估 ===');
  const issues: string[] = [];
  if (!isPrime) issues.push('p 不是素数');
  if (pBits < 2048) issues.push(`p 仅 ${pBits} bits, 建议至少 2048 bits`);
  if (order < p - 1n) issues.push('g 不是生成元, 存在小群攻击风险');
  if (smallFactors.length > 0) issues.push('存在小素因子, 易受Pohlig-Hellman攻击');

  if (issues.length === 0) {
    result.push('✓ 参数安全性良好');
  } else {
    for (const issue of issues) {
      result.push(`✗ ${issue}`);
    }
  }

  return result.join('\n');
};

const knownKey = (lines: string[]): string => {
  if (lines.length < 3) throw new Error('需要3行: p, private_key, public_key');
  const p = parseBigInt(lines[0]);
  const privKey = parseBigInt(lines[1]);
  const pubKey = parseBigInt(lines[2]);

  const shared = modPow(pubKey, privKey, p);

  return [
    '=== DH 共享密钥计算 ===',
    '',
    `p = ${p}`,
    `私钥 a = ${privKey}`,
    `公钥 B = ${pubKey}`,
    '',
    `共享密钥 = B^a mod p = ${shared}`,
    '',
    `共享密钥 (hex) = ${shared.toString(16)}`,
  ].join('\n');
};

const execute = (input: string, mode: string): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  switch (mode) {
    case 'small-group':
      return smallGroupAttack(lines);
    case 'param-check':
      return paramCheck(lines);
    case 'known-key':
      return knownKey(lines);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Diffie-Hellman攻击辅助"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'small-group')
    }
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'small-group',
        options: [
          { value: 'small-group', label: '小群攻击' },
          { value: 'param-check', label: '参数检查' },
          { value: 'known-key', label: '已知密钥' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
