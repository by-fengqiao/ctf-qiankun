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

// ===== BigInt Fraction utilities for LLL =====
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

// ===== LLL (δ = 3/4) =====
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

// ===== Determinant via Bareiss algorithm (integer-preserving) =====
const determinant = (matrix: bigint[][]): bigint => {
  const n = matrix.length;
  if (n === 0) return 1n;
  const M: bigint[][] = matrix.map((r: bigint[]) => [...r]);
  let sign = 1n;
  let prev = 1n;
  for (let i = 0; i < n; i++) {
    if (M[i][i] === 0n) {
      let swapRow = -1;
      for (let k = i + 1; k < n; k++) {
        if (M[k][i] !== 0n) {
          swapRow = k;
          break;
        }
      }
      if (swapRow === -1) return 0n;
      [M[i], M[swapRow]] = [M[swapRow], M[i]];
      sign = -sign;
    }
    for (let k = i + 1; k < n; k++) {
      for (let j = i + 1; j < n; j++) {
        M[k][j] = (M[k][j] * M[i][i] - M[k][i] * M[i][j]) / prev;
      }
    }
    prev = M[i][i];
  }
  return sign * M[n - 1][n - 1];
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

const normApprox = (sqNorm: bigint): string => {
  if (sqNorm === 0n) return '0';
  if (sqNorm < 9007199254740991n) {
    return Math.sqrt(Number(sqNorm)).toFixed(6);
  }
  const intSqrt = isqrt(sqNorm);
  const fracPart = sqNorm - intSqrt * intSqrt;
  return `${intSqrt}.${fracPart.toString().padStart(6, '0').slice(0, 6)}`;
};

const sqNorm = (v: Vec): bigint => v.reduce((s: bigint, x: bigint) => s + x * x, 0n);

const execute = (input: string): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  if (lines.length === 0) throw new Error('请输入格基 (每行一个基向量, 元素空格分隔)');
  const basis: Vec[] = lines.map((l: string) =>
    l.split(/\s+/).filter((s: string) => s).map((s: string) => BigInt(s)),
  );
  const n = basis.length;
  if (n > 10) throw new Error(`维度 ${n} 超过限制 (≤ 10)`);
  const m = basis[0].length;
  for (const row of basis) {
    if (row.length !== m) throw new Error('所有行维度必须一致');
  }
  if (m === 0) throw new Error('基向量不能为空');

  const origDet = determinant(basis);
  const reduced = lllReduce(basis);

  const normsOrig = basis.map((v: Vec) => sqNorm(v));
  const normsReduced = reduced.map((v: Vec) => sqNorm(v));

  let shortestIdx = 0;
  for (let i = 1; i < reduced.length; i++) {
    if (normsReduced[i] < normsReduced[shortestIdx]) shortestIdx = i;
  }

  const out: string[] = [];
  out.push('=== LLL 格归约 ===');
  out.push(`输入维度: ${n} × ${m}`);
  out.push(`δ = 3/4 (标准 LLL 参数)`);
  out.push('');
  out.push('归约前基向量:');
  for (let i = 0; i < basis.length; i++) {
    out.push(`  b${i}: [${basis[i].join(', ')}]  |·|² = ${normsOrig[i]}`);
  }
  out.push('');
  out.push('归约后基向量 (LLL-reduced):');
  for (let i = 0; i < reduced.length; i++) {
    out.push(`  b${i}*: [${reduced[i].join(', ')}]  |·|² = ${normsReduced[i]}`);
  }
  out.push('');
  out.push('=== 最短向量 ===');
  out.push(`向量: [${reduced[shortestIdx].join(', ')}]`);
  out.push(`|·|² = ${normsReduced[shortestIdx]}`);
  out.push(`|·| ≈ ${normApprox(normsReduced[shortestIdx])}`);
  out.push('');
  out.push('=== 格行列式 ===');
  const absDet = origDet < 0n ? -origDet : origDet;
  out.push(`det(L) = ${origDet}`);
  out.push(`|det(L)| = ${absDet}`);
  if (origDet === 0n) {
    out.push('⚠️ 行列式为 0: 基向量线性相关, 格为退化格');
  } else {
    out.push(`|det(L)|^(1/n) ≈ ${normApprox(absDet)} (Hermite 因子参考)`);
  }
  return out.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="LLL格归约"
    execute={(input: string, _mode: string, _params: Record<string, unknown>) =>
      execute(input)
    }
  />
);

export default ToolComponent;
