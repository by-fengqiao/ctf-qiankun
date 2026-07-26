import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const PIXEL = 8;

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'cols',
        label: '每行列数',
        type: 'select',
        default: '8',
        options: [
          { value: '4', label: '4' },
          { value: '8', label: '8' },
          { value: '16', label: '16' },
          { value: '32', label: '32' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const cols = parseInt((params.cols as string) ?? '8', 10) || 8;
      const bytes = getInputBytes(input);
      if (bytes.length === 0) return '请输入要可视化二进制的内容';
      const maxBytes = Math.min(bytes.length, 256);
      const rows = Math.ceil(maxBytes / cols);
      const canvas = document.createElement('canvas');
      canvas.width = cols * 8 * PIXEL;
      canvas.height = rows * PIXEL;
      const ctx = canvas.getContext('2d');
      const lines: string[] = [
        `显示前 ${maxBytes} 字节的二进制位图 (共 ${bytes.length} 字节)`,
        `每行 ${cols} 字节 = ${cols * 8} bits`,
        `位图尺寸: ${canvas.width}x${canvas.height} px`,
        '',
        '── 二进制位图 (黑=1, 白=0) ──',
      ];

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        for (let i = 0; i < maxBytes; i++) {
          const byte = bytes[i];
          const row = Math.floor(i / cols);
          const col = i % cols;
          for (let bit = 0; bit < 8; bit++) {
            if ((byte >> (7 - bit)) & 1) {
              ctx.fillRect(
                (col * 8 + bit) * PIXEL,
                row * PIXEL,
                PIXEL,
                PIXEL,
              );
            }
          }
        }
        lines.push(canvas.toDataURL('image/png'));
      }

      if (bytes.length > maxBytes) {
        lines.push(`\n...(共 ${bytes.length} 字节，仅显示前 ${maxBytes} 字节)`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
