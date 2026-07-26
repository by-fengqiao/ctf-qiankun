import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      {
        name: 'direction',
        label: '方向',
        type: 'select',
        default: 'horizontal',
        options: [
          { value: 'horizontal', label: '水平翻转' },
          { value: 'vertical', label: '垂直翻转' },
        ],
      },
    ]}
    execute={async (input: string, _mode: string, params: Record<string, unknown>, file?: File | null) => {
      const direction = (params.direction as string) || 'horizontal';
      if (file) {
        const { canvas: sourceCanvas, width, height } = await loadImageToCanvas(file);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '无法获取 Canvas 上下文';
        if (direction === 'horizontal') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(0, height);
          ctx.scale(1, -1);
        }
        ctx.drawImage(sourceCanvas, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        return [
          '图片翻转',
          `原始尺寸: ${width} × ${height}`,
          `翻转方向: ${direction === 'horizontal' ? '水平' : '垂直'}`,
          '',
          `翻转后图片预览:`,
          dataUrl,
        ].join('\n');
      }
      if (!input) return '请拖入图片文件进行翻转';
      return [
        '图片翻转操作说明',
        `翻转方向: ${direction === 'horizontal' ? '水平' : '垂直'}`,
        '',
        '请拖入图片文件以执行实际翻转',
        '',
        direction === 'horizontal'
          ? '水平翻转: 左右镜像，宽高不变'
          : '垂直翻转: 上下镜像，宽高不变',
      ].join('\n');
    }}
  />
);

export default ToolComponent;
