import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'encode') {
        if (!input.includes(':')) {
          throw new Error('编码格式需要 user:password');
        }
        const encoded = btoa(unescape(encodeURIComponent(input)));
        return `Authorization: Basic ${encoded}`;
      }
      const cleaned = input.replace(/^Basic\s+/i, '').trim();
      const decoded = decodeURIComponent(escape(atob(cleaned)));
      if (!decoded.includes(':')) {
        throw new Error('解码结果缺少 : 分隔符');
      }
      const colonIdx = decoded.indexOf(':');
      const username = decoded.slice(0, colonIdx);
      const password = decoded.slice(colonIdx + 1);
      return `用户名: ${username}\n密码: ${password}`;
    }}
  />
);

export default ToolComponent;
