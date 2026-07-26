import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const TAB = '\t';
const SPACE = ' ';
const BITS_PER_BYTE = 8;

function xorWithPassword(
  data: Uint8Array,
  password: string,
): Uint8Array {
  if (!password) return data;
  const keyBytes = new TextEncoder().encode(password);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

function byteToWhitespace(byte: number): string {
  let result = '';
  for (let i = BITS_PER_BYTE - 1; i >= 0; i--) {
    result += (byte >> i) & 1 ? TAB : SPACE;
  }
  return result;
}

function whitespaceToByte(chars: string): number {
  let byte = 0;
  for (let i = 0; i < BITS_PER_BYTE; i++) {
    byte = (byte << 1) | (chars[i] === TAB ? 1 : 0);
  }
  return byte;
}

function snowHide(coverText: string, message: string, password: string): string {
  const msgBytes = new TextEncoder().encode(message);
  const encrypted = xorWithPassword(msgBytes, password);

  const lengthBytes = new Uint8Array(4);
  new DataView(lengthBytes.buffer).setUint32(0, encrypted.length, false);
  const allBytes = new Uint8Array(lengthBytes.length + encrypted.length);
  allBytes.set(lengthBytes, 0);
  allBytes.set(encrypted, lengthBytes.length);

  let whitespace = '';
  for (let i = 0; i < allBytes.length; i++) {
    whitespace += byteToWhitespace(allBytes[i]);
  }

  let result = coverText;
  if (result.length > 0 && !result.endsWith('\n')) {
    result += '\n';
  }
  result += whitespace;
  return result;
}

function snowExtract(text: string, password: string): string {
  const trailing = text.match(/[\t ]+$/);
  if (!trailing) {
    throw new Error('未找到尾部空白字符，可能不含隐藏消息');
  }

  const whitespace = trailing[0];
  if (whitespace.length < 32) {
    throw new Error(
      `尾部空白字符不足 (需要至少 32 个，当前 ${whitespace.length} 个)`,
    );
  }

  const byteCount = Math.floor(whitespace.length / BITS_PER_BYTE);
  const allBytes = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i++) {
    const chunk = whitespace.substring(
      i * BITS_PER_BYTE,
      i * BITS_PER_BYTE + BITS_PER_BYTE,
    );
    allBytes[i] = whitespaceToByte(chunk);
  }

  const msgLen = new DataView(allBytes.buffer).getUint32(0, false);
  if (msgLen > byteCount - 4 || msgLen === 0) {
    throw new Error(
      `提取的消息长度异常 (${msgLen})，可能密码错误或数据损坏`,
    );
  }

  const msgBytes = allBytes.subarray(4, 4 + msgLen);
  const decrypted = xorWithPassword(msgBytes, password);

  return new TextDecoder('utf-8', { fatal: false }).decode(decrypted);
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="SNOW 隐写"
    paramsConfig={[
      {
        name: 'mode',
        label: '操作',
        type: 'select',
        default: 'hide',
        options: [
          { value: 'hide', label: '隐藏消息' },
          { value: 'extract', label: '提取消息' },
        ],
      },
      {
        name: 'password',
        label: '密码(可选)',
        type: 'text',
        default: '',
        placeholder: '留空则不加密',
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const op = (params.mode as string) || 'hide';
      const password = (params.password as string) || '';

      if (op === 'hide') {
        const lines = input.split('\n');
        let cover = '';
        let message = '';

        if (lines.length >= 2) {
          cover = lines.slice(0, -1).join('\n');
          message = lines[lines.length - 1];
        } else {
          throw new Error(
            '请在第一行输入掩护文本，第二行输入要隐藏的消息',
          );
        }

        const result = snowHide(cover, message, password);
        let output = '=== SNOW 隐写 - 隐藏结果 ===\n\n';
        output += `掩护文本长度: ${cover.length} 字符\n`;
        output += `隐藏消息: ${message.length} 字符\n`;
        output += `密码: ${password ? '已设置' : '无'}\n`;
        output += `编码方式: 二进制 (每字节 8 个空白字符)\n`;
        output += `隐藏后总空白字符数: ${result.length - cover.length - 1}\n\n`;
        output += `--- 隐写文本 (注意尾部空白) ---\n${result}`;
        return output;
      }

      const result = snowExtract(input, password);
      let output = '=== SNOW 隐写 - 提取结果 ===\n\n';
      output += `密码: ${password ? '已设置' : '无'}\n`;
      output += `输入文本长度: ${input.length} 字符\n`;
      output += `尾部空白字符数: ${(input.match(/[\t ]+$/) ?? [''])[0].length}\n\n`;
      output += `--- 提取到的消息 ---\n${result}`;
      return output;
    }}
  />
);

export default ToolComponent;
