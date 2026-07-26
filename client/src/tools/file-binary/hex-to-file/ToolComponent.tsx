import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'filename',
        label: '文件名',
        type: 'text',
        default: 'output.bin',
        placeholder: 'output.bin',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const filename = (params.filename as string) ?? 'output.bin';
      const cleaned = input.replace(/\s/g, '').toLowerCase();
      if (cleaned.length === 0) throw new Error('输入为空');
      if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
      const bytes: number[] = [];
      for (let i = 0; i < cleaned.length; i += 2) {
        const byte = parseInt(cleaned.slice(i, i + 2), 16);
        if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${cleaned.slice(i, i + 2)}`);
        bytes.push(byte);
      }
      const uint8 = new Uint8Array(bytes);
      const blob = new Blob([uint8], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return `文件已触发下载:\n文件名: ${filename}\n大小: ${bytes.length} bytes\n\n数据预览 (前 64 bytes):\n${Array.from(uint8.slice(0, 64)).map((b: number) => b.toString(16).padStart(2, '0')).join(' ')}`;
    }}
  />
);
export default ToolComponent;
