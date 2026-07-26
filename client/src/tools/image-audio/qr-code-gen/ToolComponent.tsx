import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      <div className="hidden">
        <QRCodeCanvas
          value={props.input || ' '}
          size={256}
          level={(props.params.level as 'L' | 'M' | 'Q' | 'H') || 'M'}
          ref={canvasRef}
        />
      </div>
      <SimpleTool
        {...props}
        paramsConfig={[
          {
            name: 'level',
            label: '容错',
            type: 'select',
            default: 'M',
            options: [
              { value: 'L', label: 'L (7%)' },
              { value: 'M', label: 'M (15%)' },
              { value: 'Q', label: 'Q (25%)' },
              { value: 'H', label: 'H (30%)' },
            ],
          },
        ]}
        execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
          if (!props.input) return '请输入要编码为二维码的文本';
          const canvas = canvasRef.current;
          if (!canvas) return '二维码画布未就绪，请稍后重试';
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const level = (params.level as string) || 'M';
            return [
              '二维码已生成',
              `内容长度: ${props.input.length} 字符`,
              `容错等级: ${level}`,
              '',
              dataUrl,
            ].join('\n');
          } catch {
            return '生成二维码失败，请重试';
          }
        }}
      />
    </>
  );
};
export default ToolComponent;
