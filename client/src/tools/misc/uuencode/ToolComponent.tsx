import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function uuencode(data: Uint8Array): string {
  const lines: string[] = [];
  lines.push('begin 644 file');

  for (let i = 0; i < data.length; i += 45) {
    const chunk = data.subarray(i, Math.min(i + 45, data.length));
    const len = chunk.length;
    lines.push(String.fromCharCode((len & 0x3f) + 32));

    let lineIdx = lines.length - 1;
    let line = lines[lineIdx];

    for (let j = 0; j < len; j += 3) {
      const b1 = chunk[j] ?? 0;
      const b2 = j + 1 < len ? chunk[j + 1] : 0;
      const b3 = j + 2 < len ? chunk[j + 2] : 0;

      const c1 = ((b1 >> 2) & 0x3f) + 32;
      const c2 = (((b1 << 4) | (b2 >> 4)) & 0x3f) + 32;
      const c3 = (((b2 << 2) | (b3 >> 6)) & 0x3f) + 32;
      const c4 = (b3 & 0x3f) + 32;

      line += String.fromCharCode(c1, c2);
      if (j + 1 < len) line += String.fromCharCode(c3);
      if (j + 2 < len) line += String.fromCharCode(c4);
    }
    lines[lineIdx] = line;
  }

  lines.push(String.fromCharCode(32));
  lines.push('end');
  return lines.join('\n');
}

function uudecode(text: string): string {
  const lines = text.split('\n');
  let inData = false;
  const bytes: number[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/\r$/, '');
    if (trimmed.startsWith('begin ')) {
      inData = true;
      continue;
    }
    if (trimmed === 'end') {
      inData = false;
      continue;
    }
    if (!inData) continue;

    if (trimmed.length === 0) continue;
    const lenChar = trimmed.charCodeAt(0);
    const len = (lenChar - 32) & 0x3f;
    if (len === 0) continue;

    let pos = 1;
    let decoded = 0;
    while (decoded < len) {
      if (pos + 3 >= trimmed.length) break;
      const c1 = (trimmed.charCodeAt(pos) - 32) & 0x3f;
      const c2 = (trimmed.charCodeAt(pos + 1) - 32) & 0x3f;
      const c3 = (trimmed.charCodeAt(pos + 2) - 32) & 0x3f;
      const c4 = (trimmed.charCodeAt(pos + 3) - 32) & 0x3f;

      const b1 = (c1 << 2) | (c2 >> 4);
      const b2 = ((c2 << 4) | (c3 >> 2)) & 0xff;
      const b3 = ((c3 << 6) | c4) & 0xff;

      if (decoded < len) { bytes.push(b1); decoded++; }
      if (decoded < len) { bytes.push(b2); decoded++; }
      if (decoded < len) { bytes.push(b3); decoded++; }

      pos += 4;
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
}

function ascii85Encode(data: Uint8Array): string {
  let result = '<~';
  for (let i = 0; i < data.length; i += 4) {
    let n = 0;
    let padding = 0;
    for (let j = 0; j < 4; j++) {
      n = n * 256 + (i + j < data.length ? data[i + j] : 0);
      if (i + j >= data.length) padding++;
    }

    const chars: string[] = [];
    for (let j = 4; j >= 0; j--) {
      chars[j] = String.fromCharCode((n % 85) + 33);
      n = Math.floor(n / 85);
    }

    if (padding > 0) {
      result += chars.slice(0, 5 - padding).join('');
    } else {
      result += chars.join('');
    }
  }
  result += '~>';
  return result;
}

function ascii85Decode(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('<~')) cleaned = cleaned.substring(2);
  if (cleaned.endsWith('~>')) cleaned = cleaned.slice(0, -2);

  const bytes: number[] = [];
  let i = 0;

  while (i < cleaned.length) {
    let n = 0;
    let group: number[] = [];
    while (group.length < 5 && i < cleaned.length) {
      const ch = cleaned.charCodeAt(i);
      if (ch < 33 || ch > 117) {
        i++;
        continue;
      }
      group.push(ch - 33);
      i++;
    }

    if (group.length === 0) break;

    const padding = 5 - group.length;
    while (group.length < 5) group.push(84);

    n = 0;
    for (let j = 0; j < 5; j++) {
      n = n * 85 + group[j];
    }

    const b: number[] = [];
    for (let j = 3; j >= 0; j--) {
      b[j] = n & 0xff;
      n = Math.floor(n / 256);
    }

    for (let j = 0; j < 4 - padding; j++) {
      bytes.push(b[j]);
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="UUencode / Base85 编码"
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'uuencode',
        options: [
          { value: 'uuencode', label: 'UUencode 编码' },
          { value: 'uudecode', label: 'UUencode 解码' },
          { value: 'base85-encode', label: 'Base85 编码' },
          { value: 'base85-decode', label: 'Base85 解码' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const op = (params.mode as string) || 'uuencode';
      if (op === 'uuencode') {
        return uuencode(new TextEncoder().encode(input));
      }
      if (op === 'uudecode') {
        return uudecode(input);
      }
      if (op === 'base85-encode') {
        return ascii85Encode(new TextEncoder().encode(input));
      }
      if (op === 'base85-decode') {
        return ascii85Decode(input);
      }
      throw new Error(`未知模式: ${op}`);
    }}
  />
);

export default ToolComponent;
