import CryptoJS from 'crypto-js';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (input.length === 0) return '输入为空';
      const md5: string = CryptoJS.MD5(input).toString();
      const sha1: string = CryptoJS.SHA1(input).toString();
      const sha256: string = CryptoJS.SHA256(input).toString();
      return [
        '哈希摘要:',
        '',
        `MD5:    ${md5}`,
        `SHA-1:  ${sha1}`,
        `SHA-256: ${sha256}`,
        '',
        `输入长度: ${input.length} 字符`,
        `UTF-8 字节数: ${new TextEncoder().encode(input).length}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
