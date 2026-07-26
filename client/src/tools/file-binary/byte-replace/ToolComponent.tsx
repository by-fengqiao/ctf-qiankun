import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): number[] => {
  const cleaned = hex.replace(/\s/g, '').toLowerCase();
  if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
  const result: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.slice(i, i + 2), 16);
    if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${cleaned.slice(i, i + 2)}`);
    result.push(byte);
  }
  return result;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'findHex', label: '查找', type: 'text', default: '', placeholder: '如 48656c' },
      { name: 'replaceHex', label: '替换', type: 'text', default: '', placeholder: '如 575or6c' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const findHex = (params.findHex as string) ?? '';
      const replaceHex = (params.replaceHex as string) ?? '';
      if (!findHex) throw new Error('请输入查找的 Hex 值');
      const findBytes = hexToBytes(findHex);
      const replaceBytes = hexToBytes(replaceHex);
      if (findBytes.length !== replaceBytes.length) {
        throw new Error('查找和替换的字节长度必须相同');
      }
      const inputBytes = hexToBytes(input);
      let count = 0;
      for (let i = 0; i <= inputBytes.length - findBytes.length; i++) {
        let match = true;
        for (let j = 0; j < findBytes.length; j++) {
          if (inputBytes[i + j] !== findBytes[j]) { match = false; break; }
        }
        if (match) {
          for (let j = 0; j < replaceBytes.length; j++) {
            inputBytes[i + j] = replaceBytes[j];
          }
          count++;
          i += findBytes.length - 1;
        }
      }
      const resultHex = inputBytes
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join(' ');
      return `替换完成，共替换 ${count} 处\n\n${resultHex}`;
    }}
  />
);
export default ToolComponent;
