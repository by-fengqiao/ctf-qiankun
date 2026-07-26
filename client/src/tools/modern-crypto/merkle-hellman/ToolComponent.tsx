import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const parseBigArr = (s: string): bigint[] =>
  s.trim().split(/[\s,]+/).filter((x: string) => x).map((x: string) => {
    if (x.startsWith('0x') || x.startsWith('0X')) return BigInt(x);
    return BigInt(x);
  });

const modInv = (a: bigint, m: bigint): bigint => {
  let oldR = ((a % m) + m) % m, r = m;
  let oldS = 1n, s = 0n;
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) throw new Error('模逆不存在');
  return ((oldS % m) + m) % m;
};

const isSuperIncreasing = (arr: bigint[]): boolean => {
  let sum = 0n;
  for (const v of arr) {
    if (v <= sum) return false;
    sum += v;
  }
  return true;
};

const tryRecoverPrivateKey = (pubKey: bigint[]): { m: bigint; w: bigint; superKey: bigint[] } | null => {
  const n = pubKey.length;
  if (n > 25 || n < 2) return null;

  const total = pubKey.reduce((a: bigint, b: bigint) => a + b, 0n);

  for (let m = total + 1n; m <= total + 1000n; m++) {
    for (let w = 2n; w < m; w++) {
      let g = w, mm = m;
      while (mm > 0n) [g, mm] = [mm, g % mm];
      if (g !== 1n) continue;

      const wInv = modInv(w, m);
      const privKey = pubKey.map((p: bigint) => (p * wInv) % m);

      if (isSuperIncreasing(privKey)) {
        return { m, w, superKey: privKey };
      }
    }
  }

  for (let w = 2n; w < 1000n; w++) {
    for (let m = total + 1n; m <= total + 100n; m++) {
      let g = w, mm = m;
      while (mm > 0n) [g, mm] = [mm, g % mm];
      if (g !== 1n) continue;

      const wInv = modInv(w, m);
      const privKey = pubKey.map((p: bigint) => (p * wInv) % m);

      if (isSuperIncreasing(privKey)) {
        return { m, w, superKey: privKey };
      }
    }
  }

  return null;
};

const decryptMerkleHellman = (
  ciphertext: string,
  pubKey: bigint[],
  m: bigint,
  w: bigint,
  superKey: bigint[]
): string => {
  const wInv = modInv(w, m);
  const bits: number[] = [];

  for (const c of ciphertext.trim()) {
    if (c === '0' || c === '1') {
      bits.push(parseInt(c));
    }
  }

  const blockSize = superKey.length;
  const results: string[] = [];

  for (let i = 0; i < bits.length; i += blockSize) {
    const block = bits.slice(i, i + blockSize);
    let cVal = 0n;
    for (let j = 0; j < block.length && j < blockSize; j++) {
      if (block[j]) cVal += pubKey[j];
    }

    const cPrime = (cVal * wInv) % m;
    const plain: number[] = [];
    let remaining = cPrime;

    for (let j = blockSize - 1; j >= 0; j--) {
      if (remaining >= superKey[j]) {
        plain[j] = 1;
        remaining -= superKey[j];
      } else {
        plain[j] = 0;
      }
    }

    const byteBits = plain.join('');
    if (byteBits.length === 8) {
      results.push(String.fromCharCode(parseInt(byteBits, 2)));
    } else {
      results.push(byteBits);
    }
  }

  return results.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="merkle-hellman"
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', options: [
        { value: 'auto', label: '自动(暴力)' },
        { value: 'manual', label: '手动(已知m,w)' },
      ], default: 'auto' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const lines = input.trim().split('\n').filter((l: string) => l.trim());
      if (lines.length < 2) throw new Error('需要2行输入: 第1行=公钥(空格分隔), 第2行=密文(01串)');
      const pubKey = parseBigArr(lines[0]);
      const ciphertext = lines[1].trim();
      const mode = params.mode as string;

      const output: string[] = ['=== Merkle-Hellman 背包破解 ===', ''];

      if (mode === 'manual' && lines.length >= 4) {
        const m = parseBigArr(lines[2])[0];
        const w = parseBigArr(lines[3])[0];
        const wInv = modInv(w, m);
        const superKey = pubKey.map((p: bigint) => (p * wInv) % m);
        const plaintext = decryptMerkleHellman(ciphertext, pubKey, m, w, superKey);
        output.push(`模数 m = ${m}`);
        output.push(`乘子 w = ${w}`);
        output.push(`w^(-1) mod m = ${wInv}`);
        output.push(`超递增私钥: [${superKey.join(', ')}]`);
        output.push(`验证超递增: ${isSuperIncreasing(superKey) ? '是' : '否'}`);
        output.push('');
        output.push(`解密结果: ${plaintext}`);
        output.push(`密文: ${ciphertext}`);
        return output.join('\n');
      }

      output.push(`公钥 (${pubKey.length} 个): [${pubKey.join(', ')}]`);
      output.push(`公钥和: ${pubKey.reduce((a: bigint, b: bigint) => a + b, 0n)}`);
      output.push(`密文: ${ciphertext}`);
      output.push('');
      output.push('尝试暴力恢复私钥 (m, w)...');
      output.push('');

      const recovered = tryRecoverPrivateKey(pubKey);

      if (recovered) {
        output.push(`✓ 找到私钥参数!`);
        output.push(`  模数 m = ${recovered.m}`);
        output.push(`  乘子 w = ${recovered.w}`);
        output.push(`  w^(-1) mod m = ${modInv(recovered.w, recovered.m)}`);
        output.push(`  超递增私钥: [${recovered.superKey.join(', ')}]`);
        output.push(`  验证超递增: ${isSuperIncreasing(recovered.superKey) ? '是' : '否'}`);
        output.push('');

        const plaintext = decryptMerkleHellman(ciphertext, pubKey, recovered.m, recovered.w, recovered.superKey);
        output.push(`解密结果 (text): ${plaintext}`);
        output.push(`解密结果 (hex): 0x${Array.from(plaintext, (ch: string) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')}`);
      } else {
        output.push('✗ 暴力搜索未找到私钥参数');
        output.push('');
        output.push('建议:');
        output.push('1. 公钥长度可能过长，尝试手动模式');
        output.push('2. 使用LLL格归约方法:');
        output.push('   构造格: 每行 = [I_n | pubKey_i | -S]');
        output.push('   其中 S 是目标密文和');
        output.push('3. 切换到 lll-reduction 工具手动构造格');

        const sum = pubKey.reduce((a: bigint, b: bigint) => a + b, 0n);
        const targetBits = ciphertext.trim().split('').filter((c: string) => c === '1');
        let target = 0n;
        for (let i = 0; i < targetBits.length && i < pubKey.length; i++) {
          if (ciphertext[i] === '1') target += pubKey[i];
        }
        output.push('');
        output.push(`背包目标和 S = ${target}`);
        output.push('');
        output.push('LLL格构造 (n×(n+2)矩阵):');
        output.push('  [I_n | pubKey^T | 0]');
        output.push('  [0...0 | -S | 1]');
        output.push('');
        output.push('格基 (每行空格分隔BigInt):');
        for (let i = 0; i < pubKey.length; i++) {
          output.push(`  ${'1'.padStart(pubKey.length * 2).split('').map((_, j) => j === i ? '1' : '0').join(' ')} ${pubKey[i]} 0`);
        }
        output.push(`  ${pubKey.map(() => '0').join(' ')} ${-target} 1`);
      }

      return output.join('\n');
    }}
  />
);

export default ToolComponent;
