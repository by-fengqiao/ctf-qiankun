import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeStego(input: string): string {
  const lines = input.trim().split(/\s+/);
  if (lines.length === 0 || !lines[0]) return '请输入Base64字符串';
  const results: string[] = [];

  for (const b64 of lines) {
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    if (padding === 0) {
      results.push(`${b64} → 无padding，不含隐藏数据`);
      continue;
    }
    const lastChar = b64[b64.length - 1 - padding];
    const lastVal = BASE64_CHARS.indexOf(lastChar);
    if (lastVal === -1) throw new Error(`无效的Base64字符: ${lastChar}`);
    const bits = lastVal.toString(2).padStart(6, '0');
    const hiddenBits = padding === 1 ? bits.slice(-2) : bits.slice(-4);
    results.push(`${b64} → 隐藏位: ${hiddenBits} (十进制: ${parseInt(hiddenBits, 2)})`);
  }

  if (lines.length > 1) {
    let allBits = '';
    for (const b64 of lines) {
      const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
      if (padding === 0) continue;
      const lastChar = b64[b64.length - 1 - padding];
      const lastVal = BASE64_CHARS.indexOf(lastChar);
      if (lastVal === -1) continue;
      const bits = lastVal.toString(2).padStart(6, '0');
      allBits += padding === 1 ? bits.slice(-2) : bits.slice(-4);
    }
    const byteCount = Math.floor(allBits.length / 8);
    if (byteCount > 0) {
      const msgBytes: number[] = [];
      for (let i = 0; i < byteCount; i++) {
        msgBytes.push(parseInt(allBits.slice(i * 8, i * 8 + 8), 2));
      }
      try {
        const msg = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(msgBytes));
        results.push('', `拼接隐藏消息: ${msg}`);
      } catch {
        results.push('', `拼接隐藏位 (hex): ${msgBytes.map((b: number) => b.toString(16).padStart(2, '0')).join(' ')}`);
      }
    }
  }
  return results.join('\n');
}

function encodeStego(input: string, message: string): string {
  if (!message) return '请在参数中输入要隐藏的消息';
  const lines = input.trim().split(/\s+/).filter((l: string) => l.length > 0);
  if (lines.length === 0) return '请输入Base64字符串作为载体';

  const msgBytes = new TextEncoder().encode(message);
  let msgBits = '';
  for (const b of msgBytes) {
    msgBits += b.toString(2).padStart(8, '0');
  }

  let bitIdx = 0;
  const result: string[] = [];
  let totalCapacity = 0;

  for (const line of lines) {
    const b64 = line.trim();
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    if (padding === 0) {
      result.push(b64);
      continue;
    }
    totalCapacity += padding === 1 ? 2 : 4;

    if (bitIdx >= msgBits.length) {
      result.push(b64);
      continue;
    }

    const hiddenBits = padding === 1 ? 2 : 4;
    const bitsToEmbed = msgBits.slice(bitIdx, bitIdx + hiddenBits).padEnd(hiddenBits, '0');
    bitIdx += hiddenBits;

    const lastCharIdx = b64.length - 1 - padding;
    const lastChar = b64[lastCharIdx];
    const lastVal = BASE64_CHARS.indexOf(lastChar);
    if (lastVal === -1) throw new Error(`无效的Base64字符: ${lastChar}`);

    const mask = padding === 1 ? 0b11111100 : 0b11110000;
    const newVal = (lastVal & mask) | parseInt(bitsToEmbed, 2);
    const newChar = BASE64_CHARS[newVal];

    result.push(b64.slice(0, lastCharIdx) + newChar + b64.slice(lastCharIdx + 1));
  }

  const statusLines = [
    `载体: ${lines.length} 个Base64字符串`,
    `隐藏消息: "${message}" (${msgBytes.length} 字节, ${msgBits.length} 位)`,
    `总容量: ${totalCapacity} 位`,
  ];
  if (bitIdx < msgBits.length) {
    statusLines.push(`警告: 容量不足，仅嵌入了 ${bitIdx}/${msgBits.length} 位`);
  } else {
    statusLines.push(`已嵌入全部 ${msgBits.length} 位`);
  }
  statusLines.push('', '── 结果 ──', ...result);
  return statusLines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      if (mode === 'encode') {
        const message = (params.message as string) ?? '';
        return encodeStego(input, message);
      }
      return decodeStego(input);
    }}
    paramsConfig={[
      { name: 'message', label: '隐藏消息', type: 'text', placeholder: '输入要隐藏的数据（编码模式用）' },
    ]}
    modeOptions={[
      { value: 'decode', label: '提取隐写' },
      { value: 'encode', label: '嵌入隐写' },
    ]}
  />
);
export default ToolComponent;
