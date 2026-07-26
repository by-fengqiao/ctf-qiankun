import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: (number | undefined)[]): string =>
  bytes.map((b) => (b !== undefined ? b.toString(16).padStart(2, '0') : '??')).join('');

const execute = (input: string, mode: string, params: Record<string, unknown>): string => {
  const lines = input.trim().split('\n').map((l) => l.trim()).filter((l) => l);
  const ciphertext = hexToBytes(lines.join(''));
  const blockSize = 16;
  const numBlocks = Math.floor(ciphertext.length / blockSize);

  if (numBlocks < 2) throw new Error('密文至少需要2个块(32字节)');

  const blockIndex = parseInt((params.block as string) || '1', 10);
  const byteIndex = parseInt((params.byte as string) || '15', 10);
  const oracleResult = (params.oracle as string) || 'valid';

  const prevBlockStart = (blockIndex - 1) * blockSize;
  const prevBlock = ciphertext.slice(prevBlockStart, prevBlockStart + blockSize);
  const currBlock = ciphertext.slice(blockIndex * blockSize, blockIndex * blockSize + blockSize);

  switch (mode) {
    case 'next-byte': {
      if (byteIndex < 0 || byteIndex >= blockSize) throw new Error('byteIndex 范围 0-15');
      const paddingValue = blockSize - byteIndex;
      const lines2: string[] = [];
      lines2.push('=== Padding Oracle 下一字节攻击 ===');
      lines2.push(`当前攻击: Block ${blockIndex}, Byte ${byteIndex}`);
      lines2.push(`Padding 值: 0x${paddingValue.toString(16).padStart(2, '0')}`);
      lines2.push('');
      lines2.push('前一密文块 (C[i-1]):');
      lines2.push(bytesToHex(Array.from(prevBlock)));
      lines2.push('');
      lines2.push('当前密文块 (C[i]):');
      lines2.push(bytesToHex(Array.from(currBlock)));
      lines2.push('');

      if (oracleResult === 'valid') {
        const intermediateByte = paddingValue ^ prevBlock[byteIndex];
        const plaintextByte = intermediateByte ^ prevBlock[byteIndex];
        lines2.push(`Oracle 返回: VALID ✓`);
        lines2.push('');
        lines2.push('计算过程:');
        lines2.push(`  padding_value = ${blockSize} - ${byteIndex} = ${paddingValue} (0x${paddingValue.toString(16).padStart(2, '0')})`);
        lines2.push(`  C'[i-1][${byteIndex}] = ${prevBlock[byteIndex]} (0x${prevBlock[byteIndex].toString(16).padStart(2, '0')})`);
        lines2.push(`  I[i][${byteIndex}] = C'[i-1][${byteIndex}] XOR padding_value = ${prevBlock[byteIndex]} XOR ${paddingValue} = ${intermediateByte} (0x${intermediateByte.toString(16).padStart(2, '0')})`);
        lines2.push(`  P[i][${byteIndex}] = I[i][${byteIndex}] XOR C[i-1][${byteIndex}] = ${intermediateByte} XOR ${prevBlock[byteIndex]} = ${plaintextByte} (0x${plaintextByte.toString(16).padStart(2, '0')})`);
        if (plaintextByte >= 32 && plaintextByte < 127) {
          lines2.push(`  ASCII: '${String.fromCharCode(plaintextByte)}'`);
        }
      } else {
        lines2.push(`Oracle 返回: INVALID ✗`);
        lines2.push('尝试下一个 C\'[i-1][byteIndex] 值');
      }
      lines2.push('');
      lines2.push('提示: 修改 C\'[i-1][byteIndex] 从 0x00 到 0xFF,');
      lines2.push('直到 Oracle 返回 valid, 则中间值 = C\' XOR padding');
      return lines2.join('\n');
    }
    case 'show-state': {
      const intermediate: (number | undefined)[] = new Array(blockSize).fill(undefined);
      const plaintext: (number | undefined)[] = new Array(blockSize).fill(undefined);
      const stateLines: string[] = [];
      stateLines.push('=== Padding Oracle 状态显示 ===');
      stateLines.push(`密文块数: ${numBlocks}`);
      stateLines.push('');

      for (let b = 1; b < numBlocks; b++) {
        const prev = ciphertext.slice((b - 1) * blockSize, b * blockSize);
        const curr = ciphertext.slice(b * blockSize, (b + 1) * blockSize);
        stateLines.push(`--- Block ${b} ---`);
        stateLines.push(`C[${b - 1}]: ${bytesToHex(Array.from(prev))}`);
        stateLines.push(`C[${b}]:   ${bytesToHex(Array.from(curr))}`);
        stateLines.push(`I[${b}]:   ${bytesToHex(intermediate)}`);
        stateLines.push(`P[${b}]:   ${bytesToHex(plaintext)}`);
        stateLines.push('');
      }

      const recoveredCount = plaintext.filter((p) => p !== undefined).length;
      stateLines.push(`已恢复字节数: ${recoveredCount}/${blockSize * (numBlocks - 1)}`);
      stateLines.push('');
      stateLines.push('中间值 (I): 用于推导其他明文字节');
      stateLines.push('明文 (P) = I XOR C_prev');
      return stateLines.join('\n');
    }
    default:
      return '未知模式';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Padding-Oracle辅助"
    execute={(input: string, _mode: string, params: Record<string, unknown>) =>
      execute(input, (params.mode as string) || 'next-byte', params)
    }
    modeOptions={[
      { value: 'next-byte', label: '下一字节' },
      { value: 'show-state', label: '显示状态' },
    ]}
    paramsConfig={[
      { name: 'mode', label: '模式', type: 'select', default: 'next-byte', options: [
        { value: 'next-byte', label: '下一字节' },
        { value: 'show-state', label: '显示状态' },
      ] },
      { name: 'block', label: '块号', type: 'text', placeholder: '1', default: '1' },
      { name: 'byte', label: '字节', type: 'text', placeholder: '15', default: '15' },
      { name: 'oracle', label: 'Oracle', type: 'select', default: 'valid', options: [
        { value: 'valid', label: 'Valid' },
        { value: 'invalid', label: 'Invalid' },
      ] },
    ]}
  />
);

export default ToolComponent;
