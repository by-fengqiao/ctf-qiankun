import dayjs from 'dayjs';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (/^-?\d+$/.test(trimmed)) {
        let ts = parseInt(trimmed, 10);
        if (Math.abs(ts) > 1e12) {
          ts = Math.floor(ts / 1000);
        }
        const ms = ts * 1000;
        const d = dayjs(ms);
        const date = new Date(ms);
        return [
          `时间戳: ${ts}`,
          `时间戳(毫秒): ${ms}`,
          `UTC: ${date.toISOString().replace('T', ' ').replace('Z', ' UTC')}`,
          `本地: ${d.format('YYYY-MM-DD HH:mm:ss')}`,
          `ISO 8601: ${date.toISOString()}`,
          `RFC 1123: ${date.toUTCString()}`,
        ].join('\n');
      }
      const d = dayjs(trimmed);
      if (!d.isValid()) {
        throw new Error('无法解析日期，请输入时间戳或日期字符串');
      }
      return [
        `输入: ${trimmed}`,
        `Unix 时间戳(秒): ${d.unix()}`,
        `Unix 时间戳(毫秒): ${d.valueOf()}`,
        `ISO 8601: ${d.toISOString()}`,
        `格式化: ${d.format('YYYY-MM-DD HH:mm:ss')}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
