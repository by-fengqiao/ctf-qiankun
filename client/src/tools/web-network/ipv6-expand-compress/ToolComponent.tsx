import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const expandIPv6 = (addr: string): string => {
  if (!addr.includes(':')) {
    throw new Error('无效的 IPv6 地址');
  }
  let full = addr;
  if (full.includes('::')) {
    const parts = full.split('::');
    if (parts.length > 2) {
      throw new Error('IPv6 地址只能有一个 :: 缩写');
    }
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const zeros: string[] = [];
    for (let i = 0; i < missing; i++) zeros.push('0');
    full = [...left, ...zeros, ...right].join(':');
  }
  const groups = full.split(':');
  if (groups.length !== 8) {
    throw new Error('展开后应有 8 组，当前 ' + groups.length + ' 组');
  }
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) {
      throw new Error(`无效的 IPv6 分段: ${g}`);
    }
  }
  return groups.map((g) => g.padStart(4, '0').toLowerCase()).join(':');
};

const compressIPv6 = (addr: string): string => {
  const expanded = addr.includes('::') ? expandIPv6(addr) : addr;
  const groups = expanded.split(':');
  if (groups.length !== 8) {
    throw new Error('IPv6 地址需要 8 组');
  }
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) {
      throw new Error(`无效的 IPv6 分段: ${g}`);
    }
  }
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i].toLowerCase() === '0000') {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  const trimmed = groups.map((g) => g.replace(/^0+/, '') || '0');
  if (bestLen < 2) {
    return trimmed.join(':');
  }
  const left = trimmed.slice(0, bestStart).join(':');
  const right = trimmed.slice(bestStart + bestLen).join(':');
  return `${left}::${right}`;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      const expanded = expandIPv6(trimmed);
      const compressed = compressIPv6(trimmed);
      const addrType = expanded.startsWith('fe80') ? '链路本地'
        : expanded.startsWith('fc') || expanded.startsWith('fd') ? '唯一本地'
        : expanded.startsWith('ff') ? '组播'
        : expanded.startsWith('2001:db8') ? '文档示例'
        : expanded === '0000:0000:0000:0000:0000:0000:0000:0001' ? '回环地址'
        : expanded === '0000:0000:0000:0000:0000:0000:0000:0000' ? '未指定地址'
        : '全局单播';
      return [
        `展开格式: ${expanded}`,
        `压缩格式: ${compressed}`,
        `地址类型: ${addrType}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
