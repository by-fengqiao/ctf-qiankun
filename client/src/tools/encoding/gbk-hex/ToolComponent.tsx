import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      try {
        if (mode === 'encode') {
          throw new Error('浏览器环境不支持 GBK 编码，仅支持解码');
        }
        const clean = input.replace(/[\s-]/g, '');
        if (!clean) return '';
        const hexArr = clean.match(/.{1,2}/g);
        if (!hexArr) return '错误: 无效的十六进制输入';
        const bytes = new Uint8Array(hexArr.map((h: string) => parseInt(h, 16)));
        return new TextDecoder('gbk').decode(bytes);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
