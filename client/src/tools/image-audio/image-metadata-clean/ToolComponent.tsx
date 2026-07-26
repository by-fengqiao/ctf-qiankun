import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(_input: string, _mode: string, _params: Record<string, unknown>, file?: File | null) => {
      if (file) {
        const results: string[] = [
          '图片元数据清理分析',
          `文件名: ${file.name}`,
          `文件类型: ${file.type}`,
          `文件大小: ${file.size} 字节`,
          '',
          '── 可清理的元数据类型 ──',
        ];
        const isJpeg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
        const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
        const isTiff = file.type === 'image/tiff' || /\.tiff?$/i.test(file.name);
        const isWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name);
        if (isJpeg) {
          results.push('  ✓ EXIF — 相机型号、GPS、拍摄时间、曝光参数');
          results.push('  ✓ IPTC — 版权信息、关键词、作者');
          results.push('  ✓ XMP — Adobe 元数据、编辑历史');
          results.push('  ✓ JFIF — 分辨率信息');
        } else if (isPng) {
          results.push('  ✓ tEXt/zTXt/iTXt — 文本元数据块');
          results.push('  ✓ eXIf — PNG 内嵌 EXIF 数据');
          results.push('  ✓ pHYs — 物理像素尺寸');
          results.push('  ✓ tIME — 最后修改时间');
        } else if (isTiff) {
          results.push('  ✓ EXIF — 完整 EXIF 目录');
          results.push('  ✓ IPTC — IPTC IIM 数据');
          results.push('  ✓ XMP — 可扩展元数据平台');
        } else if (isWebp) {
          results.push('  ✓ EXIF — WebP 内嵌 EXIF');
          results.push('  ✓ XMP — 可扩展元数据');
          results.push('  ✓ ANIM — 动画帧信息');
        } else {
          results.push('  ⚠ 未知图片格式，无法确定元数据类型');
        }
        results.push(
          '',
          '── 清理建议 ──',
          '  1. 使用 exiftool -all= 清除所有元数据',
          '  2. 使用 ImageMagick: convert input.jpg -strip output.jpg',
          '  3. 在线工具: 查看 CTF Writeup 中的元数据清理方法',
          '',
          '提示: 清理元数据后文件大小可能减小',
        );
        return results.join('\n');
      }
      return [
        '图片元数据清理说明',
        '',
        '请拖入图片文件以分析可清理的元数据',
        '',
        '── 常见元数据类型 ──',
        '  EXIF — 相机型号、GPS 坐标、拍摄时间、曝光参数',
        '  IPTC — 版权信息、关键词、作者、标题',
        '  XMP — Adobe 元数据、编辑历史、原始文件名',
        '  ICC Profile — 颜色配置文件',
        '',
        '── 清理方法 ──',
        '  exiftool -all= input.jpg        # 清除所有元数据',
        '  convert input.jpg -strip out.jpg # ImageMagick',
        '  mogrify -strip input.jpg         # 原地修改',
      ].join('\n');
    }}
  />
);

export default ToolComponent;
