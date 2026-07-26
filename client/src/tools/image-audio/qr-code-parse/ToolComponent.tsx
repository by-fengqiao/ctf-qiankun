import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入二维码内容文本';
      const results: string[] = [
        '二维码内容解析',
        '',
        `原始内容: ${input}`,
        `内容长度: ${input.length} 字符`,
        `内容字节数: ${new TextEncoder().encode(input).length} 字节`,
        '',
        '── 内容类型判断 ──',
      ];
      if (/^https?:\/\//i.test(input)) {
        results.push('类型: URL 链接');
        try {
          const url = new URL(input);
          results.push(`  协议: ${url.protocol}`);
          results.push(`  主机: ${url.host}`);
          results.push(`  路径: ${url.pathname}`);
          if (url.search) results.push(`  参数: ${url.search}`);
        } catch {
          results.push('  (URL 解析失败)');
        }
      } else if (/^mailto:/i.test(input)) {
        results.push('类型: 邮箱地址');
      } else if (/^tel:/i.test(input)) {
        results.push('类型: 电话号码');
      } else if (/^WIFI:/i.test(input)) {
        results.push('类型: WiFi 配置');
        const ssid = input.match(/S:([^;]*)/);
        const pwd = input.match(/P:([^;]*)/);
        if (ssid) results.push(`  SSID: ${ssid[1]}`);
        if (pwd) results.push(`  密码: ${pwd[1]}`);
      } else if (/^BEGIN:VCARD/i.test(input)) {
        results.push('类型: 名片 (vCard)');
      } else if (/^geo:/i.test(input)) {
        results.push('类型: 地理位置坐标');
      } else {
        results.push('类型: 纯文本');
      }
      results.push('', '提示: 浏览器无法直接从图片解码二维码，请输入二维码的文本内容');
      return results.join('\n');
    }}
  />
);
export default ToolComponent;
