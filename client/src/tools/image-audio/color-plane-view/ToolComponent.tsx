import AsyncTool from '../../_shared/AsyncTool';
import { loadImageToCanvas } from '../../_shared/imageUtils';
import type { ToolProps } from '../../types';

const CHANNELS = [
  { key: 'R', offset: 0, label: 'R (红)' },
  { key: 'G', offset: 1, label: 'G (绿)' },
  { key: 'B', offset: 2, label: 'B (蓝)' },
];

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    paramsConfig={[
      {
        name: 'channel',
        label: '通道',
        type: 'select',
        default: 'R',
        options: [
          { value: 'R', label: 'R (红)' },
          { value: 'G', label: 'G (绿)' },
          { value: 'B', label: 'B (蓝)' },
        ],
      },
      {
        name: 'bit',
        label: '位',
        type: 'select',
        default: '7',
        options: Array.from({ length: 8 }, (_, i) => ({
          value: String(7 - i),
          label: `Bit ${7 - i}`,
        })),
      },
    ]}
    execute={async (
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
      file?: File | null,
    ) => {
      if (!file) return '请拖入图片文件';
      const { imageData, width, height } = await loadImageToCanvas(file);
      const data = imageData.data;
      const pixelCount = data.length / 4;
      const selChannel = (params.channel as string) || 'R';
      const selBit = parseInt((params.bit as string) || '7', 10);
      const chInfo = CHANNELS.find((c) => c.key === selChannel) ?? CHANNELS[0];

      const lines: string[] = [
        '色彩位平面分析',
        `像素数量: ${pixelCount}`,
        '',
        '── 位平面说明 ──',
        'Bit 7 (MSB): 最高有效位，包含主要轮廓信息',
        'Bit 6-1: 中间位，包含纹理细节',
        'Bit 0 (LSB): 最低有效位，常用于隐写',
        '',
        `── ${selChannel} 通道 Bit ${selBit} 位平面图 ──`,
      ];

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const outImg = ctx.createImageData(width, height);
        for (let i = 0; i < pixelCount; i++) {
          const srcIdx = i * 4 + chInfo.offset;
          const bitVal = (data[srcIdx] >> selBit) & 1;
          const gray = bitVal ? 255 : 0;
          outImg.data[i * 4] = gray;
          outImg.data[i * 4 + 1] = gray;
          outImg.data[i * 4 + 2] = gray;
          outImg.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(outImg, 0, 0);
        lines.push(canvas.toDataURL('image/png'));
      }

      lines.push(
        '',
        `── 各通道位平面 1 的比例 ──`,
      );
      for (const ch of CHANNELS) {
        const parts: string[] = [];
        for (let bit = 7; bit >= 0; bit--) {
          let ones = 0;
          for (let i = ch.offset; i < data.length; i += 4) {
            if ((data[i] >> bit) & 1) ones++;
          }
          const pct = ((ones / pixelCount) * 100).toFixed(1);
          const mark = ch.key === selChannel && bit === selBit ? ' ◀' : '';
          parts.push(`Bit${bit}:${pct}%${mark}`);
        }
        lines.push(`${ch.label}: ${parts.join('  ')}`);
      }
      lines.push(
        '',
        selBit === 0
          ? '当前查看 LSB 平面，隐写术常将数据藏于此处'
          : selBit === 7
            ? '当前查看 MSB 平面，包含主要轮廓与亮度信息'
            : '当前查看中间位平面，包含纹理与细节信息',
      );
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
