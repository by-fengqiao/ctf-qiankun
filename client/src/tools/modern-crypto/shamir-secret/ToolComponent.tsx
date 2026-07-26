import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

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

const randBigint = (max: bigint): bigint => {
  const bitLen = max.toString(2).length;
  const byteLen = Math.ceil(bitLen / 8);
  const arr = new Uint8Array(byteLen);
  crypto.getRandomValues(arr);
  let r = 0n;
  for (let i = 0; i < arr.length; i++) {
    r = (r << 8n) | BigInt(arr[i]);
  }
  return r % max;
};

interface SharePair {
  x: bigint;
  y: bigint;
}

const share = (lines: string[]): string => {
  if (lines.length < 4) throw new Error('需要4行: secret_hex, k, n, p');
  const secretHex = lines[0].trim();
  const secret = BigInt('0x' + secretHex);
  const k = BigInt(lines[1].trim());
  const n = BigInt(lines[2].trim());
  const p = BigInt(lines[3].trim());

  if (k < 1n) throw new Error('门限 k 至少为 1');
  if (k > n) throw new Error('门限 k 不能大于总分享数 n');
  if (secret >= p) throw new Error('秘密值必须小于 p');

  const coeffs: bigint[] = [secret];
  for (let i = 1n; i < k; i++) {
    coeffs.push(randBigint(p));
  }

  const shares: SharePair[] = [];
  for (let x = 1n; x <= n; x++) {
    let y = 0n;
    let xPow = 1n;
    for (const coeff of coeffs) {
      y = (y + coeff * xPow) % p;
      xPow = (xPow * x) % p;
    }
    shares.push({ x, y });
  }

  const result: string[] = [
    '=== Shamir 秘密分享 ===',
    '',
    `秘密 (hex): ${secretHex}`,
    `秘密 (dec): ${secret}`,
    `门限 k = ${k}, 总分享数 n = ${n}`,
    `模数 p = ${p}`,
    '',
    '生成的分享:',
  ];

  for (const s of shares) {
    result.push(`  (${s.x}, ${s.y})`);
  }

  result.push('');
  result.push('多项式系数:');
  for (let i = 0; i < coeffs.length; i++) {
    result.push(`  a${i} = ${coeffs[i]}`);
  }

  result.push('');
  result.push('可直接复制到恢复模式:');
  result.push(`${p}`);
  for (const s of shares) {
    result.push(`${s.x} ${s.y}`);
  }

  return result.join('\n');
};

const recover = (lines: string[]): string => {
  if (lines.length < 3) throw new Error('需要第1行 p, 后续每行一个分享 "x y" (至少2个分享)');

  const p = BigInt(lines[0].trim());
  const pairs: SharePair[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 2) throw new Error(`第 ${i + 1} 行格式错误, 应为 "x y"`);
    pairs.push({ x: BigInt(parts[0]), y: BigInt(parts[1]) });
  }

  if (pairs.length < 2) throw new Error('需要至少2个分享来恢复秘密');

  let secret = 0n;
  for (let i = 0; i < pairs.length; i++) {
    let num = 1n;
    let den = 1n;
    for (let j = 0; j < pairs.length; j++) {
      if (i === j) continue;
      const negXj = (((-pairs[j].x) % p) + p) % p;
      num = (num * negXj) % p;
      const diff = (((pairs[i].x - pairs[j].x) % p) + p) % p;
      den = (den * diff) % p;
    }
    const lagrange = (((pairs[i].y * num) % p) * modInv(den, p)) % p;
    secret = (secret + lagrange) % p;
  }
  secret = ((secret % p) + p) % p;

  const secretHex = secret.toString(16);

  let ascii = '(无法解码)';
  try {
    const padded = secretHex.length % 2 === 0 ? secretHex : '0' + secretHex;
    const bytes = new Uint8Array(padded.length / 2);
    for (let i = 0; i < padded.length; i += 2) {
      bytes[i / 2] = parseInt(padded.slice(i, i + 2), 16);
    }
    ascii = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    ascii = '(无法解码)';
  }

  return [
    '=== Shamir 秘密恢复 ===',
    '',
    `使用的分享数: ${pairs.length}`,
    `模数 p = ${p}`,
    '',
    `恢复的秘密 (hex):   ${secretHex}`,
    `恢复的秘密 (dec):   ${secret}`,
    `恢复的秘密 (ascii): ${ascii}`,
  ].join('\n');
};

const execute = (input: string, mode: string): string => {
  const lines = input.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  switch (mode) {
    case 'share':
      return share(lines);
    case 'recover':
      return recover(lines);
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Shamir秘密分享"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'share')
    }
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'share',
        options: [
          { value: 'share', label: '生成分享' },
          { value: 'recover', label: '恢复秘密' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
