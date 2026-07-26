import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'length', label: '长度(字节)', type: 'text', placeholder: '32', default: '32' },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const length = Math.min(
        1024,
        Math.max(1, parseInt((params.length as string) ?? '32', 10) || 32),
      );
      const arr = new Uint8Array(length);
      crypto.getRandomValues(arr);
      const hex = Array.from(arr, (b: number) => b.toString(16).padStart(2, '0')).join('');
      let bin = '';
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
      const b64 = btoa(bin);
      return [
        '=== 随机字节 ===',
        `长度: ${length} 字节 (${length * 8} bit)`,
        '',
        `Hex: ${hex}`,
        '',
        `Base64: ${b64}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
