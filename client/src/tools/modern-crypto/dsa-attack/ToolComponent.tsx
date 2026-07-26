import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const parseBigInt = (s: string): bigint => BigInt(s.trim());

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

const execute = (input: string): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  if (lines.length < 2) {
    throw new Error('需要至少2行: 第一行 "r1 s1 m1", 第二行 "r2 s2 m2", 第三行 q');
  }

  const parts1 = lines[0].split(/\s+/);
  const parts2 = lines[1].split(/\s+/);
  if (parts1.length < 3) throw new Error('第一行格式: r1 s1 m1 (空格分隔)');
  if (parts2.length < 3) throw new Error('第二行格式: r2 s2 m2 (空格分隔)');

  const r1 = parseBigInt(parts1[0]);
  const s1 = parseBigInt(parts1[1]);
  const m1 = parseBigInt(parts1[2]);
  const r2 = parseBigInt(parts2[0]);
  const s2 = parseBigInt(parts2[1]);
  const m2 = parseBigInt(parts2[2]);

  if (lines.length < 3) {
    throw new Error('需要第3行输入 q (DSA子群阶)');
  }
  const q = parseBigInt(lines[2]);

  const r = ((r1 % q) + q) % q;

  if (r1 !== r2) {
    return [
      '⚠️ 警告: r1 ≠ r2, 可能不是nonce重用!',
      `r1 = ${r1}`,
      `r2 = ${r2}`,
      'nonce重用要求 r1 = r2 (相同k产生相同r)。',
      '',
      '仍尝试计算 (使用r1)...',
      '',
    ].join('\n') + computeResult(r, s1, s2, m1, m2, q);
  }

  return computeResult(r, s1, s2, m1, m2, q);
};

const computeResult = (
  r: bigint,
  s1: bigint,
  s2: bigint,
  m1: bigint,
  m2: bigint,
  q: bigint,
): string => {
  const ds = (((s1 - s2) % q) + q) % q;
  if (bigGcd(ds, q) !== 1n) {
    throw new Error('gcd(s1-s2, q) ≠ 1, 无法求逆 (s1-s2 与 q 不互素)');
  }

  const dm = (((m1 - m2) % q) + q) % q;
  const k = (dm * modInv(ds, q)) % q;

  if (bigGcd(r, q) !== 1n) {
    throw new Error('gcd(r, q) ≠ 1, 无法求逆');
  }
  const x = ((((s1 * k - m1) % q) + q) % q * modInv(r, q)) % q;

  const verify1 = (s1 * k) % q;
  const verify2 = (m1 + x * r) % q;

  return [
    '=== DSA Nonce重用攻击结果 ===',
    '',
    '输入参数:',
    `  r  = ${r}`,
    `  s1 = ${s1}`,
    `  s2 = ${s2}`,
    `  m1 = ${m1}`,
    `  m2 = ${m2}`,
    `  q  = ${q}`,
    '',
    `恢复的 nonce  k = ${k}`,
    `恢复的私钥    x = ${x}`,
    `私钥 (hex)      = ${x.toString(16)}`,
    '',
    '验证:',
    `  s1 * k mod q     = ${verify1}`,
    `  m1 + x*r mod q   = ${verify2}`,
    `  ${verify1 === verify2 ? '✓ 验证通过' : '✗ 验证失败'}`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="DSA Nonce重用攻击"
    execute={(input: string) => execute(input)}
  />
);

export default ToolComponent;
