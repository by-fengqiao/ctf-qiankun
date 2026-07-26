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

const bigAbs = (a: bigint): bigint => (a < 0n ? -a : a);

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

const recoverParamsKnownM = (outputs: bigint[], m: bigint): { a: bigint; c: bigint } => {
  if (outputs.length < 3) throw new Error('已知 m 模式至少需要3个输出值');
  const diffs = outputs.slice(1).map((o, i) => (o - outputs[i] + m) % m);
  const diffs2 = diffs.slice(1).map((d, i) => (d - diffs[i] + m) % m);
  const g = diffs2.reduce((acc, d) => bigGcd(acc, d), diffs2[0]);
  if (g === 0n) throw new Error('差分序列为0，无法恢复参数');
  const a = (diffs[1] * modInv(diffs[0], m)) % m;
  const c = (outputs[1] - a * outputs[0]) % m;
  return { a: ((a % m) + m) % m, c: ((c % m) + m) % m };
};

const inferModulus = (outputs: bigint[]): bigint => {
  if (outputs.length < 5) throw new Error('未知 m 模式至少需要5个输出值');
  const diffs = outputs.slice(1).map((o, i) => bigAbs(o - outputs[i]));
  const diffs2 = diffs.slice(1).map((d, i) => bigAbs(d - diffs[i]));
  const diffs3 = diffs2.slice(1).map((d, i) => bigAbs(d - diffs[i]));
  const m = diffs3.reduce((acc, d) => bigGcd(acc, d), diffs3[0]);
  if (m === 0n) throw new Error('无法推断模数 m');
  return m;
};

const predictNext = (outputs: bigint[], a: bigint, c: bigint, m: bigint, count: number): bigint[] => {
  const last = outputs[outputs.length - 1];
  const predictions: bigint[] = [];
  let curr = last;
  for (let i = 0; i < count; i++) {
    curr = (a * curr + c) % m;
    predictions.push(curr);
  }
  return predictions;
};

const execute = (input: string, mode: string, params: Record<string, unknown>): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  const outputs = lines.map((l) => BigInt(l));

  switch (mode) {
    case 'known-m': {
      const mStr = (params.m as string) || '';
      if (!mStr) throw new Error('请在参数中输入模数 m');
      const m = BigInt(mStr);
      const { a, c } = recoverParamsKnownM(outputs, m);
      return [
        `已知模数 m = ${m}`,
        `恢复参数:`,
        `  a = ${a}`,
        `  c = ${c}`,
        `递推公式: X_{n+1} = (${a} * X_n + ${c}) mod ${m}`,
        ``,
        `输入序列验证:`,
        ...outputs.map((o, i) => {
          if (i === 0) return `  X[${i}] = ${o} (初始值)`;
          const expected = (a * outputs[i - 1] + c) % m;
          return `  X[${i}] = ${o} ${o === expected ? '✓' : `✗ (期望 ${expected})`}`;
        }),
      ].join('\n');
    }
    case 'unknown-m': {
      const m = inferModulus(outputs);
      const { a, c } = recoverParamsKnownM(outputs, m);
      return [
        `推断模数 m = ${m}`,
        `恢复参数:`,
        `  a = ${a}`,
        `  c = ${c}`,
        `递推公式: X_{n+1} = (${a} * X_n + ${c}) mod ${m}`,
      ].join('\n');
    }
    case 'predict': {
      const mStr = (params.m as string) || '';
      if (!mStr) throw new Error('请在参数中输入模数 m');
      const m = BigInt(mStr);
      const count = parseInt((params.count as string) || '10', 10);
      const { a, c } = recoverParamsKnownM(outputs, m);
      const predictions = predictNext(outputs, a, c, m, count);
      return [
        `恢复参数: a=${a}, c=${c}, m=${m}`,
        `预测接下来 ${count} 个值:`,
        ...predictions.map((p, i) => `  X[${outputs.length + i}] = ${p}`),
      ].join('\n');
    }
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="LCG预测器"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'known-m', params)
    }
    modeOptions={[
      { value: 'known-m', label: '已知m' },
      { value: 'unknown-m', label: '未知m' },
      { value: 'predict', label: '预测' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'known-m', options: [
        { value: 'known-m', label: '已知m' },
        { value: 'unknown-m', label: '未知m' },
        { value: 'predict', label: '预测' },
      ] },
      { name: 'm', label: '模数m', type: 'text', placeholder: '如 2^32' },
      { name: 'count', label: '预测数', type: 'text', placeholder: '10', default: '10' },
    ]}
  />
);

export default ToolComponent;
