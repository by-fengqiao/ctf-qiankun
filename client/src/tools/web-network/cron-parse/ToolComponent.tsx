import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const FIELD_NAMES = ['分钟', '小时', '日', '月', '星期'] as const;
const FIELD_RANGES: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MONTH_NAMES = [
  '', '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

const parseField = (field: string, range: [number, number]): string => {
  if (field === '*') return `每${range[0]}到${range[1]}`;
  const parts = field.split(',');
  const segments: string[] = [];
  for (const part of parts) {
    if (part.includes('/')) {
      const [base, step] = part.split('/');
      if (base === '*') {
        segments.push(`从${range[0]}开始每${step}个`);
      } else {
        segments.push(`从${base}开始每${step}个`);
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-');
      segments.push(`${start}到${end}`);
    } else {
      segments.push(part);
    }
  }
  return segments.join('、');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const fields = input.trim().split(/\s+/);
      if (fields.length !== 5) {
        throw new Error('Cron 表达式需要 5 个字段: 分 时 日 月 周');
      }
      const lines: string[] = ['=== Cron 表达式解析 ==='];
      for (let i = 0; i < 5; i++) {
        lines.push(`${FIELD_NAMES[i]}: ${parseField(fields[i], FIELD_RANGES[i])}`);
      }
      lines.push('');
      if (fields[0] === '0' && fields[1] !== '*') {
        const hour = fields[1];
        lines.push(`含义: 每天 ${hour}:00 执行`);
      } else if (fields[0] === '0' && fields[1] === '*' && fields[4] === '1-5') {
        lines.push('含义: 每个工作日（周一到周五）0点执行');
      } else if (fields[0] === '0' && fields[1] === '*' && fields[4] === '*') {
        lines.push('含义: 每小时整点执行');
      } else if (fields[0] === '*' && fields[1] === '*') {
        lines.push('含义: 每分钟执行');
      } else if (fields[0] === '0' && fields[1] === '0') {
        if (fields[2] === '*' && fields[3] === '*' && fields[4] === '*') {
          lines.push('含义: 每天午夜 00:00 执行');
        } else if (fields[2] === '1' && fields[3] === '*' && fields[4] === '*') {
          lines.push('含义: 每月1日午夜 00:00 执行');
        }
      } else if (fields[4] === '0' || fields[4] === '7') {
        lines.push('含义: 每周日执行');
      }
      if (fields[4] !== '*' && /^\d$/.test(fields[4])) {
        const day = parseInt(fields[4], 10);
        lines.push(`星期: ${WEEKDAY_NAMES[day] ?? fields[4]}`);
      }
      if (fields[3] !== '*' && /^\d+$/.test(fields[3])) {
        const month = parseInt(fields[3], 10);
        lines.push(`月份: ${MONTH_NAMES[month] ?? fields[3]}`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
