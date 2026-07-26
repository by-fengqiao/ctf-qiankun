import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      let portNum: number;
      if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) {
        portNum = parseInt(trimmed, 16);
      } else if (/^[01]+$/i.test(trimmed) && trimmed.length > 3) {
        portNum = parseInt(trimmed, 2);
      } else {
        portNum = parseInt(trimmed, 10);
      }
      if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
        throw new Error('端口号应在 0-65535 之间');
      }
      const hex = '0x' + portNum.toString(16).toUpperCase().padStart(4, '0');
      const binary = '0b' + portNum.toString(2).padStart(16, '0');
      const octal = '0o' + portNum.toString(8);
      const range =
        portNum <= 1023 ? '知名端口 (0-1023)'
        : portNum <= 49151 ? '注册端口 (1024-49151)'
        : '动态端口 (49152-65535)';
      return [
        `十进制: ${portNum}`,
        `十六进制: ${hex}`,
        `二进制: ${binary}`,
        `八进制: ${octal}`,
        ``,
        `端口范围: ${range}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
