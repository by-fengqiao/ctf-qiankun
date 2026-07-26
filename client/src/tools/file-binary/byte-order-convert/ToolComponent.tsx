import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'size',
        label: '位宽',
        type: 'select',
        default: '32',
        options: [
          { value: '16', label: '16-bit' },
          { value: '32', label: '32-bit' },
          { value: '64', label: '64-bit' },
        ],
      },
      {
        name: 'endian',
        label: '目标序',
        type: 'select',
        default: 'little',
        options: [
          { value: 'big', label: '大端 (BE)' },
          { value: 'little', label: '小端 (LE)' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const hex = input.replace(/\s/g, '').toLowerCase();
      if (!hex) return '请输入要进行字节序转换的十六进制数据';
      if (!/^[0-9a-f]*$/i.test(hex)) return '包含非十六进制字符，请检查输入';
      const size = parseInt((params.size as string) ?? '32', 10);
      const byteLen = size / 8;
      if (hex.length % (byteLen * 2) !== 0) {
        return '输入长度必须是 ' + (byteLen * 2) + ' 的倍数';
      }
      const result: string[] = [];
      for (let i = 0; i < hex.length; i += byteLen * 2) {
        const chunk = hex.slice(i, i + byteLen * 2);
        const bytes: string[] = [];
        for (let j = 0; j < chunk.length; j += 2) {
          bytes.push(chunk.slice(j, j + 2));
        }
        const reordered = params.endian === 'little' ? [...bytes].reverse() : bytes;
        const beVal = parseInt(chunk, 16);
        const leVal = parseInt([...bytes].reverse().join(''), 16);
        result.push(
          `原始: ${chunk}  →  ${params.endian === 'little' ? 'LE' : 'BE'}: ${reordered.join('')}` +
          `  (BE=${beVal}, LE=${leVal})`,
        );
      }
      return result.join('\n');
    }}
  />
);
export default ToolComponent;
