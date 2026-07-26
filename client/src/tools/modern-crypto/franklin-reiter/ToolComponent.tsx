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

// ===== Polynomial mod n =====
// coeffs lowest-first: p[0] + p[1]*x + ... + p[d]*x^d

const polyTrim = (p: bigint[]): bigint[] => {
  const c = [...p];
  while (c.length > 1 && c[c.length - 1] === 0n) c.pop();
  return c;
};

const polyDeg = (p: bigint[]): number => {
  for (let i = p.length - 1; i > 0; i--) {
    if (p[i] !== 0n) return i;
  }
  return 0;
};

const polyMod = (p: bigint[], m: bigint): bigint[] =>
  p.map((c: bigint) => ((c % m) + m) % m);

const polyAddMod = (a: bigint[], b: bigint[], n: bigint): bigint[] => {
  const len = Math.max(a.length, b.length);
  const r: bigint[] = new Array(len).fill(0n);
  for (let i = 0; i < len; i++) {
    const av = i < a.length ? a[i] : 0n;
    const bv = i < b.length ? b[i] : 0n;
    r[i] = ((av + bv) % n + n) % n;
  }
  return polyTrim(r);
};

const polySubMod = (a: bigint[], b: bigint[], n: bigint): bigint[] => {
  const len = Math.max(a.length, b.length);
  const r: bigint[] = new Array(len).fill(0n);
  for (let i = 0; i < len; i++) {
    const av = i < a.length ? a[i] : 0n;
    const bv = i < b.length ? b[i] : 0n;
    r[i] = ((av - bv) % n + n) % n;
  }
  return polyTrim(r);
};

const polyScaleMod = (p: bigint[], s: bigint, n: bigint): bigint[] => {
  const ss = ((s % n) + n) % n;
  return p.map((c: bigint) => (c * ss) % n);
};

// (a*b) mod n — schoolbook
const polyMulMod = (a: bigint[], b: bigint[], n: bigint): bigint[] => {
  const da = polyDeg(a);
  const db = polyDeg(b);
  const r: bigint[] = new Array(da + db + 1).fill(0n);
  for (let i = 0; i <= da; i++) {
    if (a[i] === 0n) continue;
    for (let j = 0; j <= db; j++) {
      r[i + j] = (r[i + j] + a[i] * b[j]) % n;
    }
  }
  return polyTrim(r);
};

// Divide a by b (mod n), returns [quotient, remainder].
// Assumes leading coeff of b is invertible mod n (normal case).
const polyDivMod = (a: bigint[], b: bigint[], n: bigint): [bigint[], bigint[]] => {
  const bb = polyTrim([...b]);
  const db = polyDeg(bb);
  if (db === 0 && bb[0] === 0n) throw new Error('除零多项式');
  let r = polyTrim([...a]);
  const da = polyDeg(r);
  if (da < db) {
    return [[0n], polyMod(r, n)];
  }
  const invLead = modInv(bb[db], n);
  const qDeg = da - db;
  const q: bigint[] = new Array(qDeg + 1).fill(0n);
  let cur = polyMod(r, n);
  let curDeg = polyDeg(cur);
  while (curDeg >= db && !(curDeg === 0 && cur[0] === 0n)) {
    const coef = (cur[curDeg] * invLead) % n;
    const shift = curDeg - db;
    q[shift] = coef;
    // cur = cur - coef * x^shift * b
    const term: bigint[] = new Array(shift + db + 1).fill(0n);
    for (let i = 0; i <= db; i++) {
      term[shift + i] = (coef * bb[i]) % n;
    }
    cur = polySubMod(cur, term, n);
    curDeg = polyDeg(cur);
    if (curDeg === 0 && cur[0] === 0n) break;
    if (curDeg < db) break;
  }
  return [polyTrim(q), polyTrim(cur)];
};

// Polynomial GCD mod n (monic-ize intermediate remainders)
const polyGcdMod = (a: bigint[], b: bigint[], n: bigint): bigint[] => {
  let r1 = polyTrim(polyMod(a, n));
  let r2 = polyTrim(polyMod(b, n));
  let guard = 0;
  while (!(polyDeg(r2) === 0 && r2[0] === 0n) && guard < 10000) {
    guard++;
    const [, rem] = polyDivMod(r1, r2, n);
    r1 = r2;
    r2 = polyTrim(rem);
  }
  // Monic-ize
  const d = polyDeg(r1);
  if (d === 0) return r1;
  const inv = modInv(r1[d], n);
  return polyScaleMod(r1, inv, n);
};

// Build (x^e - c) mod n as polynomial (lowest-first)
const buildEncPoly = (e: bigint, c: bigint, n: bigint): bigint[] => {
  const deg = Number(e);
  if (e > 100000n) throw new Error('e 过大 (>100000)，多项式构造不可行');
  const p: bigint[] = new Array(deg + 1).fill(0n);
  p[deg] = 1n;
  p[0] = ((-c) % n + n) % n;
  return p;
};

// Build ((x + delta)^e - c) mod n
// coeff of x^k in (x+delta)^e is C(e,k) * delta^(e-k); iterate k from deg down to 0.
const buildShiftedEncPoly = (e: bigint, delta: bigint, c: bigint, n: bigint): bigint[] => {
  const deg = Number(e);
  if (e > 100000n) throw new Error('e 过大 (>100000)，多项式构造不可行');
  const d = ((delta % n) + n) % n;
  const p: bigint[] = new Array(deg + 1).fill(0n);
  // Start at k=deg: C(e,e)=1, delta^0=1 → x^e coeff = 1
  let comb = 1n;
  let dPow = 1n;
  p[deg] = 1n;
  for (let k = deg - 1; k >= 0; k--) {
    // C(e,k) = C(e,k+1) * (k+1) / (e-k)
    const numRatio = BigInt(k + 1);
    const denRatio = e - BigInt(k);
    comb = (comb * numRatio % n) * modInv(denRatio, n) % n;
    // delta^(e-k): from delta^(e-(k+1)) → delta^(e-k) means multiply by delta
    dPow = (dPow * d) % n;
    p[k] = (comb * dPow) % n;
  }
  p[0] = ((p[0] - c) % n + n) % n;
  return p;
};

const hexToText = (hex: string): string => {
  try {
    const clean = hex.replace(/^0x/i, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    const s = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // printable check
    let printable = true;
    for (const ch of s) {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 0x20 && ch !== '\n' && ch !== '\t' && ch !== '\r') {
        printable = false;
        break;
      }
    }
    return printable ? s : '';
  } catch {
    return '';
  }
};

const franklinReiter = (input: string): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  if (lines.length < 5) {
    throw new Error('需要5行输入: n, e, c1, c2, delta');
  }
  const n = BigInt(lines[0]);
  const e = BigInt(lines[1]);
  const c1 = BigInt(lines[2]);
  const c2 = BigInt(lines[3]);
  const delta = BigInt(lines[4]);

  const out: string[] = [];
  out.push('=== Franklin-Reiter 相关消息攻击 ===');
  out.push(`n = ${n}`);
  out.push(`e = ${e}`);
  out.push(`c1 = ${c1}`);
  out.push(`c2 = ${c2}`);
  out.push(`delta = ${delta}`);
  out.push('');
  out.push('构造多项式 g1(x) = x^e - c1, g2(x) = (x+delta)^e - c2 mod n');

  const g1 = buildEncPoly(e, c1, n);
  const g2 = buildShiftedEncPoly(e, delta, c2, n);
  out.push(`g1 次数 = ${polyDeg(g1)}, g2 次数 = ${polyDeg(g2)}`);

  const g = polyGcdMod(g1, g2, n);
  const dg = polyDeg(g);
  out.push(`gcd 次数 = ${dg}`);
  out.push('');

  if (dg !== 1) {
    out.push('⚠️ gcd 次数 ≠ 1，攻击可能不适用或 delta 不正确');
    out.push(`gcd 多项式 (低次在前): ${g.join(' ')}`);
    out.push('');
    // Try to extract any linear factor heuristically
    return out.join('\n');
  }

  // g(x) = x + a0 (monic) → root = -a0 mod n
  const a0 = g[0];
  const m1 = ((-a0) % n + n) % n;
  out.push(`g(x) = x + ${a0}`);
  out.push(`m1 = ${m1}`);
  const m1Hex = m1.toString(16);
  out.push(`m1 (hex) = ${m1Hex}`);
  const txt = hexToText(m1Hex);
  if (txt) out.push(`m1 (text) = ${txt}`);

  // verify: m1^e mod n == c1?
  const check1 = modPow(m1, e, n);
  const check2 = modPow((m1 + delta) % n, e, n);
  out.push('');
  out.push('验证:');
  out.push(`  m1^e mod n  = ${check1}`);
  out.push(`  c1          = ${c1}`);
  out.push(`  ${check1 === c1 ? '✓ c1 验证通过' : '✗ c1 验证失败'}`);
  out.push(`  (m1+delta)^e mod n = ${check2}`);
  out.push(`  c2          = ${c2}`);
  out.push(`  ${check2 === c2 ? '✓ c2 验证通过' : '✗ c2 验证失败'}`);

  return out.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Franklin-Reiter相关消息攻击"
    execute={(input: string) => franklinReiter(input)}
  />
);

export default ToolComponent;
