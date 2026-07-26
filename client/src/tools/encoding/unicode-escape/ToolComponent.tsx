import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const encode = (input: string): string => {
  let result = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp > 0xffff) {
      const high = 0xd800 + ((cp - 0x10000) >> 10);
      const low = 0xdc00 + ((cp - 0x10000) & 0x3ff);
      result += `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
    } else {
      result += `\\u${cp.toString(16).padStart(4, '0')}`;
    }
  }
  return result;
};

const decode = (input: string): string => {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_m: string, hex: string) => {
    return String.fromCharCode(parseInt(hex, 16));
  }).replace(/\\u\{([0-9a-fA-F]+)\}/g, (_m: string, hex: string) => {
    return String.fromCodePoint(parseInt(hex, 16));
  });
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        return mode === 'encode' ? encode(input) : decode(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
