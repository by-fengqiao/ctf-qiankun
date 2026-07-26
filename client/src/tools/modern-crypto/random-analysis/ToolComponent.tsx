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

const computeEntropy = (values: bigint[]): number => {
  const freq = new Map<bigint, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) || 0) + 1);
  }
  const n = values.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

const chiSquare = (values: bigint[], numBins: number): { chi2: number; expected: number; df: number } => {
  const min = values.reduce((a, b) => (a < b ? a : b));
  const max = values.reduce((a, b) => (a > b ? a : b));
  const range = max - min;
  if (range === 0n) return { chi2: 0, expected: values.length, df: 0 };
  const binSize = Number(range) / numBins;
  const observed = new Array(numBins).fill(0);
  for (const v of values) {
    let bin = Math.floor(Number(v - min) / binSize);
    if (bin >= numBins) bin = numBins - 1;
    observed[bin]++;
  }
  const expected = values.length / numBins;
  let chi2 = 0;
  for (const obs of observed) {
    chi2 += ((obs - expected) ** 2) / expected;
  }
  return { chi2, expected, df: numBins - 1 };
};

const autocorrelation = (values: bigint[], lag: number): number => {
  const n = values.length;
  if (lag >= n) return 0;
  const mean = values.reduce((a, b) => a + b, 0n) / BigInt(n);
  const meanNum = Number(mean);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const diff = Number(values[i]) - meanNum;
    denominator += diff * diff;
    if (i < n - lag) {
      const diffLag = Number(values[i + lag]) - meanNum;
      numerator += diff * diffLag;
    }
  }
  if (denominator === 0) return 0;
  return numerator / denominator;
};

const lcgDetection = (values: bigint[]): { detected: boolean; m: bigint } => {
  if (values.length < 5) return { detected: false, m: 0n };
  const diffs = values.slice(1).map((o, i) => bigAbs(o - values[i]));
  const diffs2 = diffs.slice(1).map((d, i) => bigAbs(d - diffs[i]));
  const diffs3 = diffs2.slice(1).map((d, i) => bigAbs(d - diffs[i]));
  if (diffs3.length === 0) return { detected: false, m: 0n };
  const m = diffs3.reduce((acc, d) => bigGcd(acc, d), diffs3[0]);
  return { detected: m > 1n, m };
};

const textHistogram = (values: bigint[], numBins: number): string => {
  const min = values.reduce((a, b) => (a < b ? a : b));
  const max = values.reduce((a, b) => (a > b ? a : b));
  const range = max - min;
  if (range === 0n) return '所有值相同';
  const binSize = Number(range) / numBins;
  const bins = new Array(numBins).fill(0);
  for (const v of values) {
    let bin = Math.floor(Number(v - min) / binSize);
    if (bin >= numBins) bin = numBins - 1;
    bins[bin]++;
  }
  const maxCount = Math.max(...bins);
  const lines: string[] = [];
  const binSizeNum = Number(range) / numBins;
  for (let i = 0; i < numBins; i++) {
    const barLen = Math.round((bins[i] / maxCount) * 40);
    const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);
    const lo = (Number(min) + i * binSizeNum).toFixed(0);
    const hi = (Number(min) + (i + 1) * binSizeNum).toFixed(0);
    lines.push(`[${lo.padStart(12)} - ${hi.padStart(12)}] ${bar} ${bins[i]}`);
  }
  return lines.join('\n');
};

const execute = (input: string): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  const values = lines.map((l) => BigInt(l));
  if (values.length < 5) throw new Error('至少需要5个数值');

  const entropy = computeEntropy(values);
  const { chi2, expected, df } = chiSquare(values, 20);
  const chi2Critical = df > 0 ? 30.14 + (df - 19) * 1.5 : 0;
  const ac1 = autocorrelation(values, 1);
  const ac2 = autocorrelation(values, 2);
  const lcg = lcgDetection(values);
  const uniqueCount = new Set(values.map((v) => v.toString())).size;

  const lines2: string[] = [];
  lines2.push('=== 随机数分析 ===');
  lines2.push('');
  lines2.push(`样本数量: ${values.length}`);
  lines2.push(`唯一值数量: ${uniqueCount}`);
  lines2.push(`最小值: ${values.reduce((a, b) => (a < b ? a : b))}`);
  lines2.push(`最大值: ${values.reduce((a, b) => (a > b ? a : b))}`);
  lines2.push('');

  lines2.push('--- 卡方均匀性检验 ---');
  lines2.push(`卡方值 χ² = ${chi2.toFixed(4)}`);
  lines2.push(`自由度 df = ${df}`);
  lines2.push(`期望频数 = ${expected.toFixed(1)}`);
  lines2.push(`临界值 (α=0.05) ≈ ${chi2Critical.toFixed(2)}`);
  lines2.push(chi2 < chi2Critical ? '→ 通过均匀性检验' : '→ 未通过均匀性检验');
  lines2.push('');

  lines2.push('--- 自相关性 ---');
  lines2.push(`AC(1) = ${ac1.toFixed(6)}`);
  lines2.push(`AC(2) = ${ac2.toFixed(6)}`);
  const acAvg = (Math.abs(ac1) + Math.abs(ac2)) / 2;
  lines2.push(acAvg < 0.1 ? '→ 自相关性低，接近随机' : '→ 自相关性较高，可能有规律');
  lines2.push('');

  lines2.push('--- Shannon 熵 ---');
  lines2.push(`H = ${entropy.toFixed(4)} bits`);
  const maxEntropy = Math.log2(values.length);
  lines2.push(`最大熵 (均匀分布) = ${maxEntropy.toFixed(4)} bits`);
  lines2.push(`熵比 = ${(entropy / maxEntropy * 100).toFixed(1)}%`);
  lines2.push('');

  lines2.push('--- LCG 检测 ---');
  if (lcg.detected) {
    lines2.push(`检测到线性同余结构!`);
    lines2.push(`推断模数 m = ${lcg.m}`);
    lines2.push('→ 可能是 LCG (线性同余生成器)');
  } else {
    lines2.push('未检测到明显的 LCG 结构');
  }
  lines2.push('');

  lines2.push('--- 直方图 (20 bins) ---');
  lines2.push(textHistogram(values, 20));
  lines2.push('');

  lines2.push('--- 综合评估 ---');
  const isPseudo = chi2 < chi2Critical && acAvg < 0.15 && entropy / maxEntropy > 0.8;
  if (lcg.detected) {
    lines2.push('判定: 伪随机数 (LCG 模式)');
  } else if (isPseudo) {
    lines2.push('判定: 可能是伪随机数 (统计特性接近随机)');
  } else {
    lines2.push('判定: 统计特性异常，可能有规律或非均匀');
  }

  return lines2.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="随机数分析"
    execute={(input: string) => execute(input)}
  />
);

export default ToolComponent;
