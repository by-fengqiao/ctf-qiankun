import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adaptBias(delta: number, numpoints: number, firsttime: boolean): number {
  let d = firsttime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  d += Math.floor(d / numpoints);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) / 2) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

function digitToChar(d: number): string {
  if (d < 26) return String.fromCharCode(97 + d);
  return String.fromCharCode(22 + d);
}

function charToDigit(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 97;
  if (code >= 48 && code <= 57) return code - 22;
  throw new Error(`无效的 Punycode 字符: ${ch}`);
}

function punycodeEncodeLabel(input: string): string {
  const inputChars: number[] = [];
  const basicChars: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const cp = input.codePointAt(i)!;
    inputChars.push(cp);
    if (cp < 128) {
      basicChars.push(String.fromCharCode(cp));
    }
    if (cp > 0xffff) i++;
  }

  let output = basicChars.join('');
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  const basicLen = basicChars.length;
  let h = basicLen;
  const totalChars = inputChars.length;

  while (h < totalChars) {
    let m = Infinity;
    for (let i = 0; i < totalChars; i++) {
      const c = inputChars[i];
      if (c >= n && c < m) m = c;
    }

    delta += (m - n) * (h + 1);
    n = m;

    for (let i = 0; i < totalChars; i++) {
      const c = inputChars[i];
      if (c < n) {
        delta++;
      }
      if (c === n) {
        let q = delta;
        let k = BASE;
        while (true) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          output += digitToChar(t + ((q - t) % (BASE - t)));
          q = Math.floor((q - t) / (BASE - t));
          k += BASE;
        }
        output += digitToChar(q);
        bias = adaptBias(delta, h + 1, h === basicLen);
        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }

  if (basicLen > 0) {
    return `${basicChars.join('')}-${output.slice(basicLen)}`;
  }
  return output;
}

function punycodeDecodeLabel(input: string): string {
  const basicEnd = input.lastIndexOf('-');
  let basicStr = '';
  let extStr = input;

  if (basicEnd >= 0) {
    basicStr = input.substring(0, basicEnd);
    extStr = input.substring(basicEnd + 1);
  }

  let output = basicStr;
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  let pos = 0;

  while (pos < extStr.length) {
    const oldi = i;
    let w = 1;
    let k = BASE;
    while (true) {
      if (pos >= extStr.length) {
        throw new Error('Punycode 解码错误: 输入不完整');
      }
      const digit = charToDigit(extStr[pos]);
      pos++;
      if (digit >= BASE) {
        throw new Error('Punycode 解码错误: digit 超出范围');
      }
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      k += BASE;
    }
    bias = adaptBias(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;

    const insertChar = String.fromCodePoint(n);
    output = output.substring(0, i) + insertChar + output.substring(i);
    i++;
  }

  return output;
}

function punycodeEncodeDomain(domain: string): string {
  const labels = domain.split('.');
  const encoded = labels.map((label: string) => {
    let hasNonAscii = false;
    for (let i = 0; i < label.length; i++) {
      if (label.codePointAt(i)! >= 128) {
        hasNonAscii = true;
        break;
      }
    }
    if (!hasNonAscii) return label;
    return 'xn--' + punycodeEncodeLabel(label);
  });
  return encoded.join('.');
}

function punycodeDecodeDomain(domain: string): string {
  const labels = domain.split('.');
  const decoded = labels.map((label: string) => {
    if (label.toLowerCase().startsWith('xn--')) {
      return punycodeDecodeLabel(label.substring(4));
    }
    return label;
  });
  return decoded.join('.');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Punycode 编码转换"
    paramsConfig={[
      {
        name: 'mode',
        label: '操作',
        type: 'select',
        default: 'encode',
        options: [
          { value: 'encode', label: '编码 (Unicode→Punycode)' },
          { value: 'decode', label: '解码 (Punycode→Unicode)' },
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
        if (input.includes('.')) {
          return punycodeEncodeDomain(input.trim());
        }
        return 'xn--' + punycodeEncodeLabel(input.trim());
      }
      const cleaned = input.trim();
      if (cleaned.includes('.')) {
        return punycodeDecodeDomain(cleaned);
      }
      const label = cleaned.toLowerCase().startsWith('xn--')
        ? cleaned.substring(4)
        : cleaned;
      return punycodeDecodeLabel(label);
    }}
  />
);

export default ToolComponent;
