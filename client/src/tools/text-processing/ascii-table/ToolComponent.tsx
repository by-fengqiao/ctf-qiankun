import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const CONTROL_CHARS: Record<number, string> = {
  0: 'NUL (空字符)',
  1: 'SOH (标题开始)',
  2: 'STX (正文开始)',
  3: 'ETX (正文结束)',
  4: 'EOT (传输结束)',
  5: 'ENQ (询问)',
  6: 'ACK (确认)',
  7: 'BEL (响铃)',
  8: 'BS (退格)',
  9: 'HT (水平制表)',
  10: 'LF (换行)',
  11: 'VT (垂直制表)',
  12: 'FF (换页)',
  13: 'CR (回车)',
  14: 'SO (移出)',
  15: 'SI (移入)',
  16: 'DLE (数据链路转义)',
  17: 'DC1 (设备控制1)',
  18: 'DC2 (设备控制2)',
  19: 'DC3 (设备控制3)',
  20: 'DC4 (设备控制4)',
  21: 'NAK (否定确认)',
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

const EXTENDED_DESC: Record<number, string> = {
  128: '€', 129: '·', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡',
  136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 141: '·', 142: 'Ž', 143: '·',
  144: '·', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—',
  152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 157: '·', 158: 'ž', 159: 'Ÿ',
  160: 'NBSP (非断空格)', 161: '¡', 162: '¢', 163: '£', 164: '¤', 165: '¥',
  166: '¦', 167: '§', 168: '¨', 169: '©', 170: 'ª', 171: '«', 172: '¬',
  173: 'SHY (软连字符)', 174: '®', 175: '¯', 176: '°', 177: '±', 178: '²',
  179: '³', 180: '´', 181: 'µ', 182: '¶', 183: '·', 184: '¸', 185: '¹',
  186: 'º', 187: '»', 188: '¼', 189: '½', 190: '¾', 191: '¿',
  192: 'À', 193: 'Á', 194: 'Â', 195: 'Ã', 196: 'Ä', 197: 'Å', 198: 'Æ',
  199: 'Ç', 200: 'È', 201: 'É', 202: 'Ê', 203: 'Ë', 204: 'Ì', 205: 'Í',
  206: 'Î', 207: 'Ï', 208: 'Ð', 209: 'Ñ', 210: 'Ò', 211: 'Ó', 212: 'Ô',
  213: 'Õ', 214: 'Ö', 215: '×', 216: 'Ø', 217: 'Ù', 218: 'Ú', 219: 'Û',
  220: 'Ü', 221: 'Ý', 222: 'Þ', 223: 'ß', 224: 'à', 225: 'á', 226: 'â',
  227: 'ã', 228: 'ä', 229: 'å', 230: 'æ', 231: 'ç', 232: 'è', 233: 'é',
  234: 'ê', 235: 'ë', 236: 'ì', 237: 'í', 238: 'î', 239: 'ï', 240: 'ð',
  241: 'ñ', 242: 'ò', 243: 'ó', 244: 'ô', 245: 'õ', 246: 'ö', 247: '÷',
  248: 'ø', 249: 'ù', 250: 'ú', 251: 'û', 252: 'ü', 253: 'ý', 254: 'þ', 255: 'ÿ',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(_input: string) => {
      const sections: string[] = [];

      sections.push('=== 控制字符 (0-31) ===');
      sections.push('十进制\t十六进制\t字符\t描述');
      for (let i: number = 0; i <= 31; i++) {
        const desc: string = CONTROL_CHARS[i] || '';
        const hex: string = `0x${i.toString(16).toUpperCase().padStart(2, '0')}`;
        const display: string = i === 0 ? '␀' : `^${String.fromCharCode(i + 64)}`;
        sections.push(`${i}\t${hex}\t${display}\t${desc}`);
      }

      sections.push('');
      sections.push('=== 可打印字符 (32-126) ===');
      sections.push('十进制\t十六进制\t字符\t描述');
      for (let i: number = 32; i <= 126; i++) {
        const char: string = String.fromCharCode(i);
        let desc: string = '';
        if (i === 32) desc = 'SPACE';
        else if (i === 48) desc = '0';
        else if (i === 65) desc = 'A';
        else if (i === 97) desc = 'a';
        sections.push(
          `${i}\t0x${i.toString(16).toUpperCase().padStart(2, '0')}\t${char}\t${desc}`,
        );
      }

      sections.push('');
      sections.push(`十进制\t十六进制\t字符\t127`);
      sections.push(`127\t0x7F\t␡\t${CONTROL_CHARS[127] || 'DEL'}`);

      sections.push('');
      sections.push('=== 扩展 ASCII (128-255) ===');
      sections.push('十进制\t十六进制\t字符\t描述');
      for (let i: number = 128; i <= 255; i++) {
        const desc: string = EXTENDED_DESC[i] || '';
        const hex: string = `0x${i.toString(16).toUpperCase().padStart(2, '0')}`;
        const char: string = String.fromCharCode(i);
        sections.push(`${i}\t${hex}\t${char}\t${desc}`);
      }

      return sections.join('\n');
    }}
  />
);

export default ToolComponent;
