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
  let r = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) r = (r * base) % mod;
    exp /= 2n;
    base = (base * base) % mod;
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

// ===== BigInt Fraction utilities for LLL (rational Gram-Schmidt) =====
type Frac = { n: bigint; d: bigint };

const bgAbs = (x: bigint): bigint => (x < 0n ? -x : x);

const frac = (n: bigint, d: bigint = 1n): Frac => {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  if (d === 0n) throw new Error('零分母');
  const g = bigGcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};

const fAdd = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const fSub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const fMul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
const fDiv = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);

const fCmp = (a: Frac, b: Frac): number => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  if (l < r) return -1;
  if (l > r) return 1;
  return 0;
};

const fRound = (a: Frac): bigint => {
  const half = a.d / 2n;
  return a.n >= 0n ? (a.n + half) / a.d : -((-a.n + half) / a.d);
};

type Vec = bigint[];
type FVec = Frac[];

const dotFrac = (a: FVec, b: FVec): Frac => {
  let s = frac(0n);
  for (let i = 0; i < a.length; i++) {
    s = fAdd(s, fMul(a[i], b[i]));
  }
  return s;
};

// ===== LLL (δ = 3/4) with rational Gram-Schmidt =====
const lllReduce = (basis: Vec[]): Vec[] => {
  const n = basis.length;
  const B: Vec[] = basis.map((v: Vec) => [...v]);
  if (n <= 1) return B;

  let gsBasis: FVec[] = [];
  let mu: Frac[][] = [];
  let norms: Frac[] = [];

  const recompute = (): void => {
    gsBasis = [];
    mu = [];
    norms = [];
    for (let i = 0; i < n; i++) {
      const b: FVec = B[i].map((x: bigint) => frac(x));
      const bstar: FVec = [...b];
      const muRow: Frac[] = [];
      for (let j = 0; j < i; j++) {
        const m = fDiv(dotFrac(b, gsBasis[j]), norms[j]);
        muRow.push(m);
        for (let k = 0; k < bstar.length; k++) {
          bstar[k] = fSub(bstar[k], fMul(m, gsBasis[j][k]));
        }
      }
      gsBasis.push(bstar);
      mu.push(muRow);
      norms.push(dotFrac(bstar, bstar));
    }
  };
  recompute();

  const delta = frac(3n, 4n);
  let k = 1;
  let iter = 0;
  const maxIter = 5000;
  while (k < n && iter < maxIter) {
    iter++;
    for (let j = k - 1; j >= 0; j--) {
      const r = fRound(mu[k][j]);
      if (r !== 0n) {
        for (let idx = 0; idx < B[k].length; idx++) {
          B[k][idx] -= r * B[j][idx];
        }
        recompute();
      }
    }
    const lhs = norms[k];
    const rhs = fMul(fSub(delta, fMul(mu[k][k - 1], mu[k][k - 1])), norms[k - 1]);
    if (fCmp(lhs, rhs) >= 0) {
      k++;
    } else {
      [B[k], B[k - 1]] = [B[k - 1], B[k]];
      recompute();
      k = Math.max(1, k - 1);
    }
  }
  return B;
};

// ===== Polynomial helpers =====
const powInt = (base: bigint, exp: bigint): bigint => {
  if (exp < 0n) throw new Error('负指数不支持');
  let r = 1n;
  let b = base;
  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) r *= b;
    e /= 2n;
    b *= b;
  }
  return r;
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

const evalPoly = (coeffs: bigint[], x: bigint): bigint => {
  // coeffs[0] + coeffs[1]*x + ... + coeffs[d]*x^d (lowest-first)
  let v = 0n;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    v = v * x + coeffs[i];
  }
  return v;
};

const findIntegerRoots = (coeffs: bigint[], maxAbs: bigint): bigint[] => {
  const c: bigint[] = [...coeffs];
  while (c.length > 1 && c[c.length - 1] === 0n) c.pop();
  const d = c.length - 1;
  if (d <= 0) return [];

  const roots: bigint[] = [];
  if (c[0] === 0n) {
    roots.push(0n);
    if (d >= 1) {
      const sub = findIntegerRoots(c.slice(1), maxAbs);
      for (const r of sub) {
        if (!roots.includes(r)) roots.push(r);
      }
    }
    return roots;
  }

  if (d === 1) {
    if (c[0] % c[1] === 0n) {
      const r = -c[0] / c[1];
      if (bgAbs(r) <= maxAbs) roots.push(r);
    }
    return roots;
  }

  if (d === 2) {
    const a0 = c[0];
    const a1 = c[1];
    const a2 = c[2];
    const disc = a1 * a1 - 4n * a2 * a0;
    if (disc >= 0n) {
      const sq = isqrt(disc);
      if (sq * sq === disc) {
        for (const sgn of [1n, -1n]) {
          const num = -a1 + sgn * sq;
          const den = 2n * a2;
          if (den !== 0n && num % den === 0n) {
            const r = num / den;
            if (bgAbs(r) <= maxAbs && !roots.includes(r)) roots.push(r);
          }
        }
      }
    }
    return roots;
  }

  // d >= 3: iterate candidate roots up to a cap, plus rational root theorem
  const tried = new Set<string>();
  const cap = maxAbs < 100000n ? maxAbs : 100000n;
  for (let x = -cap; x <= cap; x++) {
    if (x === 0n) continue;
    const key = x.toString();
    if (tried.has(key)) continue;
    tried.add(key);
    if (evalPoly(c, x) === 0n) roots.push(x);
  }
  return roots;
};

// ===== Coppersmith simplified =====
const coppersmith = (
  n: bigint,
  coeffsHighFirst: bigint[],
  X: bigint,
  selectedDegree: number,
  beta: number,
): string => {
  if (n >= (1n << 256n)) throw new Error('n 过大 (限制: n < 2^256)');
  if (X <= 0n) throw new Error('X 上界必须为正整数');
  if (coeffsHighFirst.length < 2) throw new Error('多项式系数至少需要 2 个');

  // Convert highest-first → lowest-first
  const d = coeffsHighFirst.length - 1;
  const polyCoeffs: bigint[] = new Array(d + 1).fill(0n);
  for (let j = 0; j <= d; j++) {
    polyCoeffs[j] = coeffsHighFirst[d - j];
  }

  const out: string[] = [];
  out.push('=== Coppersmith 小根求解 ===');
  out.push(`n = ${n}`);
  out.push(`X (上界) = ${X}`);
  out.push(`多项式系数 (高次在前): ${coeffsHighFirst.join(' ')}`);
  out.push(`多项式系数 (低次在前): ${polyCoeffs.join(' ')}`);
  out.push(`实际度数 d = ${d}, 选择度数 = ${selectedDegree}, beta = ${beta}`);
  if (selectedDegree !== d) {
    out.push(`⚠️ 提示: 选择度数 ${selectedDegree} 与实际度数 ${d} 不一致, 已使用实际度数`);
  }
  out.push('');

  // Build lattice (d+1) × (d+1)
  // Rows: n*x^i (i=0..d-1) and f(x); columns scaled by X^j
  const dim = d + 1;
  const basis: Vec[] = [];
  for (let i = 0; i < d; i++) {
    const row: Vec = new Array(dim).fill(0n);
    row[i] = n * powInt(X, BigInt(i));
    basis.push(row);
  }
  const fRow: Vec = new Array(dim).fill(0n);
  for (let j = 0; j <= d; j++) {
    fRow[j] = polyCoeffs[j] * powInt(X, BigInt(j));
  }
  basis.push(fRow);

  out.push(`格基维度: ${dim} × ${dim}`);
  out.push('原始格基 (X 缩放后):');
  for (let i = 0; i < basis.length; i++) {
    out.push(`  行${i}: [${basis[i].join(', ')}]`);
  }
  out.push('');

  const reduced = lllReduce(basis);
  out.push('LLL 归约后格基:');
  for (let i = 0; i < reduced.length; i++) {
    out.push(`  行${i}: [${reduced[i].join(', ')}]`);
  }
  out.push('');

  let found: bigint | null = null;
  for (let rowIdx = 0; rowIdx < reduced.length; rowIdx++) {
    const v = reduced[rowIdx];
    if (v.every((x: bigint) => x === 0n)) continue;
    // Reconstruct polynomial: q(x) = sum (v_j / X^j) x^j
    // Multiply by X^d to clear denominators: coeff_j = v_j * X^(d-j)
    const polySearch: bigint[] = new Array(d + 1).fill(0n);
    for (let j = 0; j <= d; j++) {
      polySearch[j] = v[j] * powInt(X, BigInt(d - j));
    }
    const g = polySearch.reduce((acc: bigint, c: bigint) => bigGcd(acc, bgAbs(c)), 0n);
    const simp: bigint[] = g > 1n ? polySearch.map((c: bigint) => c / g) : polySearch;

    const roots = findIntegerRoots(simp, X);
    if (roots.length > 0) {
      out.push(`候选行 ${rowIdx}:`);
      out.push(`  归约多项式 (低次在前, 已约简): ${simp.join(' ')}`);
      out.push(`  整数根候选: ${roots.join(', ')}`);
      for (const root of roots) {
        const val = ((evalPoly(polyCoeffs, root) % n) + n) % n;
        const ok = val === 0n;
        out.push(`  验证 f(${root}) mod n = ${val} ${ok ? '✓' : '✗'}`);
        if (ok && found === null) found = root;
      }
    }
  }

  out.push('');
  if (found !== null) {
    out.push(`>>> 找到小根: x0 = ${found} <<<`);
    out.push(`验证: f(${found}) ≡ 0 (mod ${n})`);
  } else {
    out.push('未找到满足 f(x) ≡ 0 (mod n) 的小根');
    out.push('建议: 增大 X 上界、检查多项式系数、或确认存在小根');
  }
  return out.join('\n');
};

const execute = (input: string, _mode: string, params: Record<string, unknown>): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  if (lines.length < 3) throw new Error('需要3行输入: 第1行 n / 第2行 多项式系数 / 第3行 X上界');
  const n = BigInt(lines[0].trim());
  const coeffs = lines[1].trim().split(/\s+/).filter((s: string) => s).map((s: string) => BigInt(s));
  const X = BigInt(lines[2].trim());
  const selectedDegree = parseInt((params.degree as string) || '2', 10);
  const beta = parseFloat((params.beta as string) || '0.5');
  return coppersmith(n, coeffs, X, selectedDegree, beta);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Coppersmith小根求解"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, 'execute', params)
    }
    paramsConfig={[
      {
        name: 'degree',
        label: '度数',
        type: 'select',
        default: '2',
        options: [
          { value: '1', label: '1 (线性)' },
          { value: '2', label: '2 (二次)' },
          { value: '3', label: '3 (三次)' },
        ],
      },
      { name: 'beta', label: 'beta', type: 'text', default: '0.5', placeholder: '0.5' },
    ]}
  />
);

export default ToolComponent;
