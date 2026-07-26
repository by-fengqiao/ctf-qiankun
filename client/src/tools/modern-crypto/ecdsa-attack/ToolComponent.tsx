import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

// ===== BigInt helpers =====
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

// ===== Curve definitions =====
interface Curve {
  name: string;
  p: bigint;
  a: bigint;
  b: bigint;
  n: bigint;
  gx: bigint;
  gy: bigint;
}

const CURVES: Record<string, Curve> = {
  secp256k1: {
    name: 'secp256k1',
    p: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn,
    a: 0n,
    b: 7n,
    n: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n,
    gx: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
    gy: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n,
  },
  'p-256': {
    name: 'P-256',
    p: 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFn,
    a: -3n,
    b: 0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E2752606Bn,
    n: 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551n,
    gx: 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296n,
    gy: 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5n,
  },
};

// ===== EC point arithmetic (affine, prime curve y^2 = x^3 + ax + b mod p) =====
interface ECPoint {
  x: bigint;
  y: bigint;
}

const isInfinity = (P: ECPoint | null): P is null => P === null;

const pointAdd = (P: ECPoint | null, Q: ECPoint | null, c: Curve): ECPoint | null => {
  if (isInfinity(P)) return Q;
  if (isInfinity(Q)) return P;
  const p = c.p;
  if (P.x === Q.x && (P.y + Q.y) % p === 0n) return null; // P + (-P) = O
  let lambda: bigint;
  if (P.x === Q.x && P.y === Q.y) {
    // doubling
    const num = (3n * P.x * P.x + c.a) % p;
    const den = (2n * P.y) % p;
    lambda = (num * modInv(den, p)) % p;
  } else {
    const num = (Q.y - P.y) % p;
    const den = (Q.x - P.x) % p;
    lambda = (num * modInv(den, p)) % p;
  }
  lambda = ((lambda % p) + p) % p;
  const rx = (lambda * lambda - P.x - Q.x) % p;
  const ry = (lambda * (P.x - rx) - P.y) % p;
  return { x: ((rx % p) + p) % p, y: ((ry % p) + p) % p };
};

const scalarMul = (k: bigint, P: ECPoint | null, c: Curve): ECPoint | null => {
  if (isInfinity(P)) return null;
  let kk = ((k % c.n) + c.n) % c.n;
  let result: ECPoint | null = null;
  let addend: ECPoint | null = P;
  while (kk > 0n) {
    if (kk % 2n === 1n) result = pointAdd(result, addend, c);
    addend = pointAdd(addend, addend, c);
    kk /= 2n;
  }
  return result;
};

// ===== ECDSA verify (for validating recovered d) =====
const ecdsaVerify = (
  Q: ECPoint | null,
  z: bigint,
  r: bigint,
  s: bigint,
  c: Curve,
): boolean => {
  if (r <= 0n || r >= c.n || s <= 0n || s >= c.n) return false;
  const w = modInv(s, c.n);
  const u1 = (z * w) % c.n;
  const u2 = (r * w) % c.n;
  const G: ECPoint = { x: c.gx, y: c.gy };
  const pt = pointAdd(scalarMul(u1, G, c), scalarMul(u2, Q, c), c);
  if (pt === null) return false;
  const rCheck = pt.x % c.n;
  return rCheck === r;
};

const hexToText = (hex: string): string => {
  try {
    const clean = hex.replace(/^0x/i, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
};

// ===== Attack 1: nonce reuse =====
const attackNonceReuse = (lines: string[], c: Curve): string => {
  if (lines.length < 5) {
    throw new Error('nonce-reuse 需要5行: r, s1, z1, s2, z2');
  }
  const r = BigInt(lines[0].trim());
  const s1 = BigInt(lines[1].trim());
  const z1 = BigInt(lines[2].trim());
  const s2 = BigInt(lines[3].trim());
  const z2 = BigInt(lines[4].trim());
  const n = c.n;

  const out: string[] = ['=== ECDSA Nonce 重用攻击 ==='];
  out.push(`曲线: ${c.name}`);
  out.push(`r  = ${r}`);
  out.push(`s1 = ${s1}`);
  out.push(`z1 = ${z1}`);
  out.push(`s2 = ${s2}`);
  out.push(`z2 = ${z2}`);
  out.push('');

  const ds = (((s1 - s2) % n) + n) % n;
  if (bigGcd(ds, n) !== 1n) {
    throw new Error('gcd(s1-s2, n) ≠ 1, 无法求逆 (s1-s2 与 n 不互素)');
  }
  const dz = (((z1 - z2) % n) + n) % n;
  const k = (dz * modInv(ds, n)) % n;

  if (bigGcd(r, n) !== 1n) throw new Error('gcd(r, n) ≠ 1, 无法求逆');
  const d = ((((s1 * k - z1) % n) + n) % n * modInv(r, n)) % n;

  out.push(`恢复的 nonce k = ${k}`);
  out.push(`恢复的私钥   d = ${d}`);
  out.push(`私钥 (hex)     = ${d.toString(16)}`);
  out.push('');

  // verify: Q = d*G, then ECDSA verify both signatures
  const G: ECPoint = { x: c.gx, y: c.gy };
  const Q = scalarMul(d, G, c);
  if (Q === null) {
    out.push('⚠️ 无法计算公钥 Q = d*G');
    return out.join('\n');
  }
  out.push(`公钥 Q.x = ${Q.x.toString(16)}`);
  out.push(`公钥 Q.y = ${Q.y.toString(16)}`);
  out.push('');
  const v1 = ecdsaVerify(Q, z1, r, s1, c);
  const v2 = ecdsaVerify(Q, z2, r, s2, c);
  out.push('验证 (ECDSA 签名校验):');
  out.push(`  签名1: ${v1 ? '✓ 通过' : '✗ 失败'}`);
  out.push(`  签名2: ${v2 ? '✓ 通过' : '✗ 失败'}`);
  return out.join('\n');
};

// ===== Attack 2: nonce bias (brute force for small unknown) =====
// Input: multiple "r s z" lines. Param `bias` = known MSBs count.
// Assumes k_i < 2^(nbits - bias) (leading bits zero). Brute forces k of the
// first signature and verifies with the rest. For large unknown spaces,
// outputs the HNP instance for external LLL solving.
const attackNonceBias = (
  lines: string[],
  c: Curve,
  biasBits: number,
): string => {
  const sigs: { r: bigint; s: bigint; z: bigint }[] = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    sigs.push({ r: BigInt(parts[0]), s: BigInt(parts[1]), z: BigInt(parts[2]) });
  }
  if (sigs.length < 2) {
    throw new Error('nonce-bias 需要至少2行签名 (每行: r s z)');
  }
  const n = c.n;
  const nbits = n.toString(2).length;
  const unknownBits = nbits - biasBits;

  const out: string[] = ['=== ECDSA Nonce 偏置攻击 ==='];
  out.push(`曲线: ${c.name}`);
  out.push(`签名数量: ${sigs.length}`);
  out.push(`已知高位 bits = ${biasBits}, 未知低位 bits = ${unknownBits}`);
  out.push(`阶 n 位数 = ${nbits}`);
  out.push('');

  if (unknownBits <= 0) {
    out.push('⚠️ 未知位 ≤ 0，bias 过大');
    return out.join('\n');
  }

  const bruteCap = 1n << BigInt(unknownBits);
  const BRUTE_LIMIT = 1n << 22n; // ~4M, browser-safe

  const [first, ...rest] = sigs;
  const rInv = modInv(first.r, n);

  if (bruteCap <= BRUTE_LIMIT) {
    out.push(`尝试空间 2^${unknownBits} = ${bruteCap}，执行暴力搜索...`);
    let foundD: bigint | null = null;
    for (let k = 1n; k < bruteCap; k++) {
      const d = ((((first.s * k - first.z) % n) + n) % n * rInv) % n;
      // verify with a second signature
      const G: ECPoint = { x: c.gx, y: c.gy };
      const Q = scalarMul(d, G, c);
      if (Q !== null && ecdsaVerify(Q, rest[0].z, rest[0].r, rest[0].s, c)) {
        foundD = d;
        break;
      }
    }
    if (foundD === null) {
      out.push('✗ 暴力搜索未找到匹配的 k');
      return out.join('\n');
    }
    out.push(`恢复的私钥 d = ${foundD}`);
    out.push(`私钥 (hex)   = ${foundD.toString(16)}`);
    const G: ECPoint = { x: c.gx, y: c.gy };
    const Q = scalarMul(foundD, G, c);
    if (Q !== null) {
      out.push(`公钥 Q.x = ${Q.x.toString(16)}`);
      out.push('');
      out.push('验证 (所有签名):');
      let allOk = true;
      for (let i = 0; i < sigs.length; i++) {
        const ok = ecdsaVerify(Q, sigs[i].z, sigs[i].r, sigs[i].s, c);
        if (!ok) allOk = false;
        out.push(`  签名${i + 1}: ${ok ? '✓ 通过' : '✗ 失败'}`);
      }
      out.push(allOk ? '✓ 全部验证通过' : '✗ 部分验证失败');
    }
    return out.join('\n');
  }

  // Too large for brute force → output HNP instance for external LLL
  out.push(`⚠️ 未知空间 2^${unknownBits} 过大，暴力搜索不可行。`);
  out.push('已输出 HNP (Hidden Number Problem) 实例，可送入 LLL 工具求解:');
  out.push('');
  out.push(`n = ${n}`);
  out.push('对每个签名 i: t_i = r_i * s_i^(-1) mod n, a_i = z_i * s_i^(-1) mod n');
  out.push('目标: 求 d 使 |a_i + d*t_i mod n| < 2^' + unknownBits);
  out.push('');
  out.push('i\tr_i\t\t\ts_i\t\t\tz_i\t\t\tt_i\t\t\ta_i');
  for (let i = 0; i < sigs.length; i++) {
    const si = sigs[i];
    const sInv = modInv(si.s, n);
    const ti = (si.r * sInv) % n;
    const ai = (si.z * sInv) % n;
    out.push(`${i + 1}\t${si.r}\t${si.s}\t${si.z}\t${ti}\t${ai}`);
  }
  out.push('');
  out.push('提示: 使用 LLL 格归约求解 HNP，或减小 bias 参数后重试暴力搜索。');
  return out.join('\n');
};

// ===== Attack 3: small nonce (brute force single sig over [min,max]) =====
const attackSmallNonce = (lines: string[], c: Curve): string => {
  if (lines.length < 4) {
    throw new Error('small-nonce 需要4行: r, s, z, min_max (或 min / max 两行)');
  }
  const r = BigInt(lines[0].trim());
  const s = BigInt(lines[1].trim());
  const z = BigInt(lines[2].trim());
  // line 3 may be "min max" or just "max" (min=1). Support a 5th line as min.
  let minK: bigint;
  let maxK: bigint;
  if (lines.length >= 5) {
    minK = BigInt(lines[3].trim());
    maxK = BigInt(lines[4].trim());
  } else {
    const parts = lines[3].trim().split(/\s+/);
    if (parts.length >= 2) {
      minK = BigInt(parts[0]);
      maxK = BigInt(parts[1]);
    } else {
      minK = 1n;
      maxK = BigInt(parts[0]);
    }
  }
  const n = c.n;

  const out: string[] = ['=== ECDSA 小 Nonce 暴力攻击 ==='];
  out.push(`曲线: ${c.name}`);
  out.push(`r = ${r}`);
  out.push(`s = ${s}`);
  out.push(`z = ${z}`);
  out.push(`搜索区间 [${minK}, ${maxK}]`);
  out.push('');

  const rInv = modInv(r, n);
  const G: ECPoint = { x: c.gx, y: c.gy };
  let foundD: bigint | null = null;
  let foundK: bigint | null = null;
  for (let k = minK; k <= maxK; k++) {
    const d = ((((s * k - z) % n) + n) % n * rInv) % n;
    const Q = scalarMul(d, G, c);
    if (Q !== null && ecdsaVerify(Q, z, r, s, c)) {
      foundD = d;
      foundK = k;
      break;
    }
  }
  if (foundD === null || foundK === null) {
    out.push('✗ 在给定区间内未找到匹配的 nonce');
    return out.join('\n');
  }
  out.push(`恢复的 nonce k = ${foundK}`);
  out.push(`恢复的私钥   d = ${foundD}`);
  out.push(`私钥 (hex)     = ${foundD.toString(16)}`);
  const Q = scalarMul(foundD, G, c);
  if (Q !== null) {
    out.push(`公钥 Q.x = ${Q.x.toString(16)}`);
    out.push(`公钥 Q.y = ${Q.y.toString(16)}`);
    out.push('');
    out.push(`验证: ${ecdsaVerify(Q, z, r, s, c) ? '✓ 通过' : '✗ 失败'}`);
  }
  return out.join('\n');
};

const execute = (
  input: string,
  mode: string,
  params: Record<string, unknown>,
): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  const curveName = (params.curve as string) || 'secp256k1';
  const c = CURVES[curveName === 'p-256' ? 'p-256' : 'secp256k1'];
  switch (mode) {
    case 'nonce-reuse':
      return attackNonceReuse(lines, c);
    case 'nonce-bias': {
      const bias = parseInt((params.bias as string) || '8', 10);
      return attackNonceBias(lines, c, bias);
    }
    case 'small-nonce':
      return attackSmallNonce(lines, c);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="ECDSA攻击工具"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'nonce-reuse', params)
    }
    modeOptions={[
      { value: 'nonce-reuse', label: 'Nonce重用' },
      { value: 'nonce-bias', label: 'Nonce偏置' },
      { value: 'small-nonce', label: '小Nonce' },
    ]}
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'nonce-reuse',
        options: [
          { value: 'nonce-reuse', label: 'Nonce重用' },
          { value: 'nonce-bias', label: 'Nonce偏置' },
          { value: 'small-nonce', label: '小Nonce' },
        ],
      },
      {
        name: 'curve',
        label: '曲线',
        type: 'select',
        default: 'secp256k1',
        options: [
          { value: 'secp256k1', label: 'secp256k1' },
          { value: 'p-256', label: 'P-256' },
        ],
      },
      {
        name: 'bias',
        label: '偏置位数',
        type: 'text',
        default: '8',
      },
    ]}
  />
);

export default ToolComponent;
