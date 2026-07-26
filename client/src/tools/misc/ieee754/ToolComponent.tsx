import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function ieee754Encode(num: number, format: string): string {
  const isFloat32 = format === 'float32';
  const buffer = new ArrayBuffer(isFloat32 ? 4 : 8);
  const view = new DataView(buffer);
  if (isFloat32) {
    view.setFloat32(0, num, false);
  } else {
    view.setFloat64(0, num, false);
  }
  const bytes = new Uint8Array(buffer);
  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hexParts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  const hex = hexParts.join(' ');

  const expBits = isFloat32 ? 8 : 11;
  const mantBits = isFloat32 ? 23 : 52;
  const bias = isFloat32 ? 127 : 1023;

  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }

  const sign = bits[0];
  const exponent = bits.substring(1, 1 + expBits);
  const mantissa = bits.substring(1 + expBits);
  const expValue = parseInt(exponent, 2);

  let result = `IEEE 754 ${format.toUpperCase()} 编码结果\n\n`;
  result += `十进制值: ${num}\n`;
  result += `十六进制: ${hexParts.join('')}\n`;
  result += `十六进制(带空格): ${hex}\n\n`;
  result += `位布局:\n`;
  result += `  符号位 (1 bit):  ${sign}  → ${sign === '0' ? '正数' : '负数'}\n`;
  result += `  指数 (${expBits} bits): ${exponent}  → 原始=${expValue}, 偏移=${bias}, 实际=${expValue - bias}\n`;
  result += `  尾数 (${mantBits} bits): ${mantissa}\n\n`;
  result += `完整二进制:\n`;
  result += `  ${sign} | ${exponent} | ${mantissa}\n`;
  result += `  ${bits}`;
  return result;
}

function ieee754Decode(hexInput: string, format: string): string {
  const cleaned = hexInput.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  const isFloat32 = format === 'float32';
  const expectedLen = isFloat32 ? 8 : 16;

  if (cleaned.length !== expectedLen) {
    throw new Error(
      `${format} 需要 ${expectedLen} 个十六进制字符，得到 ${cleaned.length} 个`,
    );
  }
  if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }

  const byteCount = isFloat32 ? 4 : 8;
  const buffer = new ArrayBuffer(byteCount);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }

  const value = isFloat32 ? view.getFloat32(0, false) : view.getFloat64(0, false);

  const expBits = isFloat32 ? 8 : 11;
  const mantBits = isFloat32 ? 23 : 52;
  const bias = isFloat32 ? 127 : 1023;

  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }

  const sign = bits[0];
  const exponent = bits.substring(1, 1 + expBits);
  const mantissa = bits.substring(1 + expBits);
  const expValue = parseInt(exponent, 2);
  const maxExp = isFloat32 ? 255 : 2047;

  let expDesc: string;
  if (expValue === 0) {
    expDesc = '零/非规格化数';
  } else if (expValue === maxExp) {
    expDesc = '无穷大/NaN';
  } else {
    expDesc = `原始=${expValue}, 偏移=${bias}, 实际=${expValue - bias}`;
  }

  let result = `IEEE 754 ${format.toUpperCase()} 解码结果\n\n`;
  result += `十六进制输入: ${cleaned.toUpperCase()}\n\n`;
  result += `位布局:\n`;
  result += `  符号位 (1 bit):  ${sign}  → ${sign === '0' ? '正数' : '负数'}\n`;
  result += `  指数 (${expBits} bits): ${exponent}  → ${expDesc}\n`;
  result += `  尾数 (${mantBits} bits): ${mantissa}\n\n`;
  result += `十进制值: ${value}\n`;
  if (Number.isNaN(value)) {
    result += `值类型: NaN\n`;
  } else if (!Number.isFinite(value)) {
    result += `值类型: ${value > 0 ? '正无穷' : '负无穷'}\n`;
  }
  result += `\n完整二进制:\n`;
  result += `  ${sign} | ${exponent} | ${mantissa}\n`;
  result += `  ${bits}`;
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="IEEE 754 浮点数转换"
    paramsConfig={[
      {
        name: 'format',
        label: '格式',
        type: 'select',
        default: 'float32',
        options: [
          { value: 'float32', label: 'Float32 (32位)' },
          { value: 'float64', label: 'Float64 (64位)' },
        ],
      },
      {
        name: 'mode',
        label: '操作',
        type: 'select',
        default: 'encode',
        options: [
          { value: 'encode', label: '编码 (十进制→Hex)' },
          { value: 'decode', label: '解码 (Hex→十进制)' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const format = (params.format as string) || 'float32';
      const op = (params.mode as string) || 'encode';
      if (op === 'encode') {
        const num = parseFloat(input.trim());
        if (Number.isNaN(num)) {
          throw new Error('无法解析为数字，请输入有效的十进制数');
        }
        return ieee754Encode(num, format);
      }
      return ieee754Decode(input, format);
    }}
  />
);

export default ToolComponent;
