import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (!trimmed.startsWith('magnet:?')) {
        throw new Error('无效的 Magnet 链接');
      }
      const params = trimmed.slice('magnet:?'.length);
      const pairs = params.split('&').filter(Boolean);
      const fields: Record<string, string[]> = {};
      const names: Record<string, string> = {
        xt: '扩展主题 (哈希)',
        dn: '显示名称',
        tr: 'Tracker 地址',
        xl: '精确长度',
        xs: '扩展来源',
        as: '可接受来源',
        kt: '关键词',
        mt: 'Manifest 链接',
      };
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1) continue;
        const key = pair.slice(0, eqIdx);
        const value = decodeURIComponent(pair.slice(eqIdx + 1));
        if (!fields[key]) fields[key] = [];
        fields[key].push(value);
      }
      const lines: string[] = [];
      if (fields.xt) {
        for (const xt of fields.xt) {
          const hashMatch = xt.match(/urn:btih:([a-fA-F0-9]+)/i);
          if (hashMatch) {
            lines.push(`哈希: ${hashMatch[1]}`);
          } else {
            lines.push(`扩展主题: ${xt}`);
          }
        }
      }
      if (fields.dn) {
        lines.push(`名称: ${fields.dn.join(', ')}`);
      }
      if (fields.xl) {
        const bytes = parseInt(fields.xl[0], 10);
        if (!isNaN(bytes)) {
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          let size = bytes;
          let unit = 0;
          while (size >= 1024 && unit < sizes.length - 1) {
            size /= 1024;
            unit++;
          }
          lines.push(`大小: ${size.toFixed(2)} ${sizes[unit]} (${bytes} bytes)`);
        }
      }
      if (fields.tr) {
        lines.push(`Trackers (${fields.tr.length}):`);
        fields.tr.forEach((t, i) => lines.push(`  [${i + 1}] ${t}`));
      }
      if (fields.kt) {
        lines.push(`关键词: ${fields.kt.join(', ')}`);
      }
      for (const [key, values] of Object.entries(fields)) {
        if (!names[key]) {
          lines.push(`${key}: ${values.join(', ')}`);
        }
      }
      return lines.length > 0 ? lines.join('\n') : '未解析到有效字段';
    }}
  />
);

export default ToolComponent;
