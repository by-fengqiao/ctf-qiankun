import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const CONTROL_CHAR_NAMES: Record<number, string> = {
  0: 'NUL (空字符)',
  1: 'SOH (标题开始)',
  2: 'STX (正文开始)',
  3: 'ETX (正文结束)',
  4: 'EOT (传输结束)',
  5: 'ENQ (询问)',
  6: 'ACK (确认)',
  7: 'BEL (响铃)',
  8: 'BS (退格)',
  9: 'HT (水平制表符)',
  10: 'LF (换行)',
  11: 'VT (垂直制表符)',
  12: 'FF (换页)',
  13: 'CR (回车)',
  14: 'SO (移出)',
  15: 'SI (移入)',
  16: 'DLE (数据链路转义)',
  17: 'DC1 (设备控制1)',
  18: 'DC2 (设备控制2)',
  19: 'DC3 (设备控制3)',
  20: 'DC4 (设备控制4)',
  21: 'NAK (否认)',
  22: 'SYN (同步空闲)',
  23: 'ETB (传输块结束)',
  24: 'CAN (取消)',
  25: 'EM (介质结束)',
  26: 'SUB (替换)',
  27: 'ESC (转义)',
  28: 'FS (文件分隔符)',
  29: 'GS (组分隔符)',
  30: 'RS (记录分隔符)',
  31: 'US (单元分隔符)',
  127: 'DEL (删除)',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(_input: string) => {
      const lines: string[] = ['十进制\t十六进制\t名称'];
      for (let i: number = 0; i <= 31; i++) {
        lines.push(
          `${i}\t0x${i.toString(16).toUpperCase().padStart(2, '0')}\t${CONTROL_CHAR_NAMES[i] ?? '未知'}`,
        );
      }
      lines.push(
        `127\t0x7F\t${CONTROL_CHAR_NAMES[127] ?? '未知'}`,
      );
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
