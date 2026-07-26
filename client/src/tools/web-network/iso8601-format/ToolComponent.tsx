import dayjs from 'dayjs';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      const d = dayjs(trimmed);
      if (!d.isValid()) {
        throw new Error('无法解析 ISO 8601 日期');
      }
      return [
        `输入: ${trimmed}`,
        `ISO 8601: ${d.toISOString()}`,
        `日期: ${d.format('YYYY-MM-DD')}`,
        `时间: ${d.format('HH:mm:ss')}`,
        `时区偏移: ${d.format('Z')}`,
        `星期: ${d.format('dddd')}`,
        `Unix 时间戳: ${d.unix()}`,
        `RFC 1123: ${new Date(d.valueOf()).toUTCString()}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
