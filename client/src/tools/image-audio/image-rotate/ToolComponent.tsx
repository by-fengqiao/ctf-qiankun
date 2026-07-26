import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      {
        name: 'degrees',
        label: '角度',
        type: 'select',
        default: '90',
        options: [
          { value: '90', label: '90°' },
          { value: '180', label: '180°' },
          { value: '270', label: '270°' },
        ],
      },
    ]}
    execute={async (input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      const degrees = parseInt((params.degrees as string) || '90', 10);
      if (file) {
        const { canvas: sourceCanvas, width, height } = await loadImageToCanvas(file);
        const canvas = document.createElement('canvas');
        if (degrees === 90 || degrees === 270) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return '无法获取 Canvas 上下文';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(sourceCanvas, -width / 2, -height / 2);
        const dataUrl = canvas.toDataURL('image/png');
        return [
          '图片旋转',
          `原始尺寸: ${width} × ${height}`,
          `旋转角度: ${degrees}°`,
          `旋转后尺寸: ${canvas.width} × ${canvas.height}`,
          '',
          `旋转后图片预览:`,
          dataUrl,
        ].join('\n');
      }
      if (!input) return '请拖入图片文件进行旋转';
      return [
        '图片旋转操作说明',
        `旋转角度: ${degrees}°`,
        '',
        '请拖入图片文件以执行实际旋转',
        '',
        `旋转 ${degrees}° 后:`,
        degrees === 90 ? '  宽高互换，图像顺时针旋转 90 度' : '',
        degrees === 180 ? '  尺寸不变，图像旋转 180 度' : '',
        degrees === 270 ? '  宽高互换，图像逆时针旋转 90 度' : '',
      ].filter(Boolean).join('\n');
    }}
  />
);

export default ToolComponent;
