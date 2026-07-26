import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface CurveParams {
  p: bigint;
  a: bigint;
  b: bigint;
  name: string;
}

const PRESETS: Record<string, CurveParams> = {
  'secp256k1': {
    name: 'secp256k1',
    p: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn,
    a: 0n,
    b: 7n,
  },
  'P-256': {
    name: 'P-256 (secp256r1)',
    p: 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFn,
    a: 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFCn,
    b: 0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604Bn,
  },
  'curve25519': {
    name: 'Curve25519 (Montgomery, a=486662)',
    p: 2n ** 255n - 19n,
    a: 486662n,
    b: 1n,
  },
  'custom': {
    name: '自定义曲线',
    p: 97n,
    a: 2n,
    b: 3n,
  },
};

const modInv = (a: bigint, m: bigint): bigint => {
  const egcd = (aa: bigint, bb: bigint): [bigint, bigint, bigint] => {
    if (bb === 0n) return [aa, 1n, 0n];
    const [g, x, y] = egcd(bb, aa % bb);
    return [g, y, x - (aa / bb) * y];
  };
  const [g, x] = egcd(((a % m) + m) % m, m);
  if (g !== 1n) throw new Error('模逆不存在');
  return ((x % m) + m) % m;
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

interface Point {
  x: bigint;
  y: bigint;
}

const isOnCurve = (pt: Point, c: CurveParams): boolean => {
  const { p, a, b } = c;
  const lhs = (pt.y * pt.y) % p;
  const rhs = (pt.x * pt.x * pt.x + a * pt.x + b) % p;
  return lhs === rhs;
};

const pointAdd = (p1: Point, p2: Point, c: CurveParams): Point => {
  const { p, a } = c;
  if (p1.x === p2.x && p1.y === p2.y) {
    return pointDouble(p1, c);
  }
  const lambda = ((p2.y - p1.y) * modInv(p2.x - p1.x, p)) % p;
  const x3 = (lambda * lambda - p1.x - p2.x) % p;
  const y3 = (lambda * (p1.x - x3) - p1.y) % p;
  return { x: ((x3 % p) + p) % p, y: ((y3 % p) + p) % p };
};

const pointDouble = (pt: Point, c: CurveParams): Point => {
  const { p, a } = c;
  const lambda = ((3n * pt.x * pt.x + a) * modInv(2n * pt.y, p)) % p;
  const x3 = (lambda * lambda - 2n * pt.x) % p;
  const y3 = (lambda * (pt.x - x3) - pt.y) % p;
  return { x: ((x3 % p) + p) % p, y: ((y3 % p) + p) % p };
};

const pointNegate = (pt: Point, p: bigint): Point => ({
  x: pt.x,
  y: ((-pt.y) % p + p) % p,
});

const scalarMul = (k: bigint, pt: Point, c: CurveParams): Point => {
  let result = { ...pt };
  let addend = { ...pt };
  const bits = k.toString(2);
  if (bits === '0') throw new Error('k不能为0');
  result = { x: pt.x, y: pt.y };
  for (let i = 1; i < bits.length; i++) {
    result = pointDouble(result, c);
    if (bits[i] === '1') {
      result = pointAdd(result, addend, c);
    }
  }
  return result;
};

const discreteLog = (g: Point, h: Point, c: CurveParams): bigint => {
  let curr = { ...g };
  for (let k = 1n; k < 1000000n; k++) {
    if (curr.x === h.x && curr.y === h.y) return k;
    curr = pointAdd(curr, g, c);
  }
  throw new Error('离散对数未找到 (阶 > 10^6)');
};

const parseCurveFromInput = (lines: string[], preset: string): { curve: CurveParams; consumed: number } => {
  if (preset === 'custom') {
    if (lines.length < 3) throw new Error('自定义曲线需要: p, a, b (每行一个)');
    return {
      curve: {
        name: '自定义曲线',
        p: BigInt(lines[0].trim()),
        a: BigInt(lines[1].trim()),
        b: BigInt(lines[2].trim()),
      },
      consumed: 3,
    };
  }
  return { curve: PRESETS[preset] || PRESETS['secp256k1'], consumed: 0 };
};

const parsePoint = (line: string): Point => {
  const parts = line.trim().split(/\s+/);
  return { x: BigInt(parts[0]), y: BigInt(parts[1]) };
};

const execute = (input: string, mode: string, params: Record<string, unknown>): string => {
  const preset = (params.preset as string) || 'secp256k1';
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  const { curve, consumed } = parseCurveFromInput(lines, preset);
  const rest = lines.slice(consumed);

  switch (mode) {
    case 'point-add': {
      const p1 = parsePoint(rest[0]);
      const p2 = parsePoint(rest[1]);
      if (!isOnCurve(p1, curve)) throw new Error(`P1 不在曲线上`);
      if (!isOnCurve(p2, curve)) throw new Error(`P2 不在曲线上`);
      const result = pointAdd(p1, p2, curve);
      return [
        `曲线: ${curve.name}`,
        `p = ${curve.p}`,
        `a = ${curve.a}, b = ${curve.b}`,
        `P1 = (${p1.x}, ${p1.y})`,
        `P2 = (${p2.x}, ${p2.y})`,
        `P1 + P2 = (${result.x}, ${result.y})`,
      ].join('\n');
    }
    case 'point-double': {
      const pt = parsePoint(rest[0]);
      if (!isOnCurve(pt, curve)) throw new Error(`P 不在曲线上`);
      const result = pointDouble(pt, curve);
      return [
        `曲线: ${curve.name}`,
        `P = (${pt.x}, ${pt.y})`,
        `2P = (${result.x}, ${result.y})`,
      ].join('\n');
    }
    case 'scalar-mul': {
      const k = BigInt(rest[0].trim());
      const pt = parsePoint(rest[1]);
      if (!isOnCurve(pt, curve)) throw new Error(`P 不在曲线上`);
      const result = scalarMul(k, pt, curve);
      return [
        `曲线: ${curve.name}`,
        `k = ${k}`,
        `P = (${pt.x}, ${pt.y})`,
        `kP = (${result.x}, ${result.y})`,
      ].join('\n');
    }
    case 'negate': {
      const pt = parsePoint(rest[0]);
      if (!isOnCurve(pt, curve)) throw new Error(`P 不在曲线上`);
      const result = pointNegate(pt, curve.p);
      return [
        `曲线: ${curve.name}`,
        `P = (${pt.x}, ${pt.y})`,
        `-P = (${result.x}, ${result.y})`,
        `验证 P + (-P) = O (无穷远点)`,
      ].join('\n');
    }
    case 'verify': {
      const pt = parsePoint(rest[0]);
      const onCurve = isOnCurve(pt, curve);
      const lhs = (pt.y * pt.y) % curve.p;
      const rhs = (pt.x * pt.x * pt.x + curve.a * pt.x + curve.b) % curve.p;
      return [
        `曲线: ${curve.name}`,
        `p = ${curve.p}`,
        `a = ${curve.a}, b = ${curve.b}`,
        `点 P = (${pt.x}, ${pt.y})`,
        ``,
        `y² mod p = ${lhs}`,
        `x³ + ax + b mod p = ${rhs}`,
        `y² ≡ x³ + ax + b (mod p): ${onCurve ? '✓ 在曲线上' : '✗ 不在曲线上'}`,
      ].join('\n');
    }
    case 'discrete-log': {
      const g = parsePoint(rest[0]);
      const h = parsePoint(rest[1]);
      if (!isOnCurve(g, curve)) throw new Error('G 不在曲线上');
      if (!isOnCurve(h, curve)) throw new Error('H 不在曲线上');
      const k = discreteLog(g, h, curve);
      return [
        `曲线: ${curve.name}`,
        `G = (${g.x}, ${g.y})`,
        `H = (${h.x}, ${h.y})`,
        `k = ${k}`,
        `验证: ${k}G = (${scalarMul(k, g, curve).x}, ${scalarMul(k, g, curve).y})`,
      ].join('\n');
    }
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="椭圆曲线计算器"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'point-add', params)
    }
    modeOptions={[
      { value: 'point-add', label: '点加' },
      { value: 'point-double', label: '点倍' },
      { value: 'scalar-mul', label: '标量乘法' },
      { value: 'negate', label: '求逆' },
      { value: 'verify', label: '验证点' },
      { value: 'discrete-log', label: '离散对数' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'point-add', options: [
        { value: 'point-add', label: '点加' },
        { value: 'point-double', label: '点倍' },
        { value: 'scalar-mul', label: '标量乘法' },
        { value: 'negate', label: '求逆' },
        { value: 'verify', label: '验证点' },
        { value: 'discrete-log', label: '离散对数' },
      ] },
      { name: 'preset', label: '曲线', type: 'select', default: 'secp256k1', options: [
        { value: 'secp256k1', label: 'secp256k1' },
        { value: 'P-256', label: 'P-256' },
        { value: 'curve25519', label: 'Curve25519' },
        { value: 'custom', label: '自定义' },
      ] },
    ]}
  />
);

export default ToolComponent;
