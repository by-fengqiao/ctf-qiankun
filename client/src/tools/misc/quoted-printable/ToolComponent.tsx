import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function qpEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    let encoded: string;
    const ch = String.fromCharCode(byte);

    if (
      (byte >= 33 && byte <= 60) ||
      (byte >= 62 && byte <= 126)
    ) {
      encoded = ch;
    } else if (byte === 9 || byte === 32) {
      const nextByte = i < bytes.length - 1 ? bytes[i + 1] : -1;
      if (nextByte === -1 || nextByte === 13 || nextByte === 10) {
        encoded = '=' + byte.toString(16).toUpperCase().padStart(2, '0');
      } else {
        encoded = ch;
      }
    } else if (byte === 13 || byte === 10) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = '';
      }
      if (byte === 13 && i < bytes.length - 1 && bytes[i + 1] === 10) {
        i++;
      }
      lines.push('');
      continue;
    } else {
      encoded = '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    }

    if (currentLine.length + encoded.length > 75) {
      lines.push(currentLine + '=');
      currentLine = '';
    }
    currentLine += encoded;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.join('\r\n');
}

function qpDecode(input: string): string {
  const cleaned = input.replace(/=\r\n/g, '').replace(/=\n/g, '');
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '=') {
      if (i + 2 < cleaned.length) {
        const hexStr = cleaned.substring(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hexStr)) {
          bytes.push(parseInt(hexStr, 16));
          i += 2;
          continue;
        }
      }
      bytes.push(61);
    } else {
      bytes.push(ch.charCodeAt(0));
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
}

function qpEncodeEmail(input: string): string {
  const encoded = qpEncode(input);
  const body = encoded.replace(/ /g, '_').replace(/\r\n/g, '');
  return `=?UTF-8?Q?${body}?=`;
}

function qpDecodeEmail(input: string): string {
  const match = input.match(/=\?([^?]+)\?([QqBb])\?([^?]+)\?=/);
  if (!match) {
    return qpDecode(input);
  }
  const [, charset, encoding, data] = match;
  if (encoding.toUpperCase() === 'Q') {
    const decoded = data.replace(/_/g, ' ');
    const bytes: number[] = [];
    for (let i = 0; i < decoded.length; i++) {
      if (decoded[i] === '=' && i + 2 < decoded.length) {
        const hexStr = decoded.substring(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hexStr)) {
          bytes.push(parseInt(hexStr, 16));
          i += 2;
        } else {
          bytes.push(decoded.charCodeAt(i));
        }
      } else {
        bytes.push(decoded.charCodeAt(i));
      }
    }
    return new TextDecoder(charset.toLowerCase(), { fatal: false }).decode(
      new Uint8Array(bytes),
    );
  }
  const bytes = atob(data);
  return new TextDecoder(charset.toLowerCase(), { fatal: false }).decode(
    new TextEncoder().encode(bytes),
  );
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Quoted-Printable 编码"
    paramsConfig={[
      {
        name: 'mode',
        label: '操作',
        type: 'select',
        default: 'encode',
        options: [
          { value: 'encode', label: '编码' },
          { value: 'decode', label: '解码' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const op = (params.mode as string) || 'encode';
      if (op === 'encode') {
        const isEmail = input.includes('=?UTF-8?') || input.length < 200;
        if (isEmail && !input.includes('\n')) {
          return qpEncodeEmail(input) + '\n\n--- 标准 QP 编码 ---\n' + qpEncode(input);
        }
        return qpEncode(input);
      }
      if (input.includes('=?') && input.includes('?=')) {
        return qpDecodeEmail(input);
      }
      return qpDecode(input);
    }}
  />
);

export default ToolComponent;
