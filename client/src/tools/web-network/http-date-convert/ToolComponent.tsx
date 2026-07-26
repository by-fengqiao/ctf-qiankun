import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

dayjs.extend(customParseFormat);

const RFC1123 = 'ddd, DD MMM YYYY HH:mm:ss [GMT]';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (/^-?\d+$/.test(trimmed)) {
        const ts = parseInt(trimmed, 10);
        const ms = Math.abs(ts) > 1e12 ? ts : ts * 1000;
        const d = new Date(ms);
        return [
          `时间戳: ${ts}`,
          `RFC 1123: ${d.toUTCString()}`,
          `ISO 8601: ${d.toISOString()}`,
        ].join('\n');
      }
      const d = dayjs(trimmed, RFC1123, true);
      if (!d.isValid()) {
        const fallback = dayjs(trimmed);
        if (!fallback.isValid()) {
          throw new Error('无法解析日期，请输入时间戳或 RFC 1123 日期');
        }
        return [
          `输入: ${trimmed}`,
          `Unix 时间戳: ${fallback.unix()}`,
          `RFC 1123: ${new Date(fallback.valueOf()).toUTCString()}`,
        ].join('\n');
      }
      return [
        `输入: ${trimmed}`,
        `Unix 时间戳: ${d.unix()}`,
        `ISO 8601: ${d.toISOString()}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
