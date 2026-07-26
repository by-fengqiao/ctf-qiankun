import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

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

const parseBig = (s: string): bigint => {
  const t = s.trim();
  if (t.startsWith('0x') || t.startsWith('0X')) return BigInt(t);
  if (/^\d+$/.test(t)) return BigInt(t);
  return BigInt(t);
};

const B_CONST = (k: number): bigint => 2n ** BigInt(8 * (k - 2));

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="bleichenbacher"
    paramsConfig={[
      { name: 'oracle', label: 'Oracle', type: 'select', options: [
        { value: 'init', label: '初始化' },
        { value: 'valid', label: '有效(S_i)' },
        { value: 'invalid', label: '无效' },
      ], default: 'init' },
      { name: 's', label: '当前s', type: 'text', placeholder: '留空自动计算', default: '' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const lines = input.trim().split('\n').filter((l: string) => l.trim());
      if (lines.length < 3) throw new Error('需要3行输入: n, e, c (每行一个，支持0x前缀)');
      const n = parseBig(lines[0]);
      const e = parseBig(lines[1]);
      const c = parseBig(lines[2]);

      const k = Math.ceil(n.toString(16).length / 2);
      const B = B_CONST(k);
      const B2 = 2n * B;
      const B3 = 3n * B;
      const oracle = params.oracle as string;
      const sParam = params.s as string;

      if (oracle === 'init') {
        const s1 = (n + B3 - 1n) / B3;
        const c1 = (c * modPow(s1, e, n)) % n;
        return [
          '=== Bleichenbacher 攻击初始化 ===',
          '',
          `模数 n (${k} 字节): 0x${n.toString(16).slice(0, 32)}...`,
          `公钥 e: ${e}`,
          `密文 c: 0x${c.toString(16).slice(0, 32)}...`,
          `B = 2^(8*(k-2)) = 2^${8 * (k - 2)}`,
          '',
          `初始 s_1 = ceil(n / 3B) = ${s1}`,
          `c_1 = c * s_1^e mod n`,
          `c_1 (hex): 0x${c1.toString(16)}`,
          '',
          '请将 c_1 发送给 Oracle，根据返回结果选择：',
          '  - 有效 → 设置 oracle=valid, s=' + s1.toString(),
          '  - 无效 → 设置 oracle=invalid, s=' + s1.toString(),
          '',
          '有效时明文范围: [2B, 3B-1] = [0x' + B2.toString(16) + ', 0x' + (B3 - 1n).toString(16) + ']',
        ].join('\n');
      }

      const s = sParam ? parseBig(sParam) : ((n + B3 - 1n) / B3);

      if (oracle === 'invalid') {
        const sNext = s + 1n;
        const cNext = (c * modPow(sNext, e, n)) % n;
        return [
          '=== Bleichenbacher 步骤 (无效) ===',
          '',
          `s = ${s} → Oracle返回: 无效`,
          '明文不在 [2B, 3B-1] 范围内',
          '',
          `下一个 s = ${sNext}`,
          `c' = c * ${sNext}^e mod n = 0x${cNext.toString(16)}`,
          '',
          '请将此 c\' 发送给 Oracle，设置 s=' + sNext.toString() + ' 并选择 oracle 结果',
        ].join('\n');
      }

      if (oracle === 'valid') {
        const r = B2;
        const sR = ((r * n + B3 - 1n) / B3);
        const cR = (c * modPow(sR, e, n)) % n;
        const M_lower = ((s * B2) % n + n) % n;
        const M_upper = ((s * (B3 - 1n)) % n + n) % n;

        return [
          '=== Bleichenbacher 步骤 (有效!) ===',
          '',
          `s = ${s} → Oracle返回: 有效`,
          '明文在 [2B, 3B-1] 范围内',
          '',
          '当前明文范围估计:',
          `  下界: 0x${M_lower.toString(16)}`,
          `  上界: 0x${M_upper.toString(16)}`,
          '',
          '下一轮: 在 r*B3 <= s*(M_upper) 的范围内搜索',
          `  下一个 s 尝试: ${sR}`,
          `  c' = 0x${cR.toString(16)}`,
          '',
          '请将此 c\' 发送给 Oracle，设置 s=' + sR.toString() + ' 并选择 oracle 结果',
          '',
          '提示: 每轮有效结果会缩小明文范围，',
          '当范围收敛到单个值时即恢复明文。',
        ].join('\n');
      }

      return '请选择 oracle 参数 (init/valid/invalid)';
    }}
  />
);

export default ToolComponent;
