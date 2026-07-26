import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'width', label: '原图宽', type: 'text', placeholder: '宽', default: '800' },
      { name: 'height', label: '原图高', type: 'text', placeholder: '高', default: '600' },
      { name: 'x', label: '起点X', type: 'text', placeholder: 'X', default: '0' },
      { name: 'y', label: '起点Y', type: 'text', placeholder: 'Y', default: '0' },
      { name: 'cropW', label: '裁剪宽', type: 'text', placeholder: '裁剪宽', default: '100' },
      { name: 'cropH', label: '裁剪高', type: 'text', placeholder: '裁剪高', default: '100' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ) => {
      const W = parseInt((params.width as string) || '800', 10);
      const H = parseInt((params.height as string) || '600', 10);
      const X = parseInt((params.x as string) || '0', 10);
      const Y = parseInt((params.y as string) || '0', 10);
      const cW = parseInt((params.cropW as string) || '100', 10);
      const cH = parseInt((params.cropH as string) || '100', 10);
      if (W <= 0 || H <= 0 || cW <= 0 || cH <= 0) return '宽高必须为正数';
      if (X < 0 || Y < 0 || X >= W || Y >= H) return `起点 (${X},${Y}) 超出原图范围 (0~${W - 1}, 0~${H - 1})`;
      const endX = X + cW;
      const endY = Y + cH;
      const actualW = Math.min(cW, W - X);
      const actualH = Math.min(cH, H - Y);
      const outOfBounds = endX > W || endY > H;
      const results: string[] = [
        '图片裁剪计算',
        `原图尺寸: ${W} × ${H}`,
        `裁剪区域: (${X}, ${Y}) → (${endX}, ${endY})`,
        `裁剪尺寸: ${cW} × ${cH}`,
        '',
        '── 计算结果 ──',
        `实际裁剪尺寸: ${actualW} × ${actualH}`,
        `裁剪面积: ${actualW * actualH} 像素`,
        `原图面积: ${W * H} 像素`,
        `面积比例: ${((actualW * actualH) / (W * H) * 100).toFixed(2)}%`,
        `起始像素偏移: ${Y * W + X}`,
      ];
      if (outOfBounds) {
        results.push('', `⚠ 裁剪区域超出原图边界！将自动截断至 ${actualW} × ${actualH}`);
      }
      results.push(
        '',
        '── CSS 裁剪语法 ──',
        `clip-path: inset(${Y}px ${W - endX}px ${H - endY}px ${X}px);`,
        `object-fit: cover; object-position: -${X}px -${Y}px;`,
      );
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
