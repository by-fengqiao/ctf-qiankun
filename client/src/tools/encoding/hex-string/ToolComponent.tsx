import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string, params: Record<string, unknown>): string => {
  const separator = (params.separator as string) ?? '';
  const upper = (params.upper as string) === 'true';
  const bytes = strToBytes(input);
  let result = Array.from(bytes, (b: number) => {
    const h = b.toString(16).padStart(2, '0');
    return upper ? h.toUpperCase() : h;
  }).join(separator);
  if ((params.prefix as string) === '0x') {
    result = result.split(separator).map((h: string) => `0x${h}`).join(separator);
  }
  return result;
};

const decode = (input: string): string => {
  const clean = input.replace(/0x/gi, '').replace(/[\s,;:_-]/g, '');
  if (!clean) return '';
  const hexArr = clean.match(/.{1,2}/g);
  if (!hexArr) return '错误: 无效的十六进制输入';
  const bytes = new Uint8Array(hexArr.map((h: string) => parseInt(h, 16)));
  return bytesToStr(bytes);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      try {
        return mode === 'encode' ? encode(input, params) : decode(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
    paramsConfig={[
      {
        name: 'separator',
        label: '分隔符',
        type: 'select',
        default: '',
        options: [
          { value: '', label: '无' },
          { value: ' ', label: '空格' },
          { value: '-', label: '横杠' },
          { value: ':', label: '冒号' },
        ],
      },
      {
        name: 'upper',
        label: '大小写',
        type: 'select',
        default: 'false',
        options: [
          { value: 'false', label: '小写' },
          { value: 'true', label: '大写' },
        ],
      },
      {
        name: 'prefix',
        label: '前缀',
        type: 'select',
        default: '',
        options: [
          { value: '', label: '无' },
          { value: '0x', label: '0x' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
