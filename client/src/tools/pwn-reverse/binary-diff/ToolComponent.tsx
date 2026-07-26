import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

interface DiffRow {
  offset: number;
  a: number;
  b: number;
}

const tryParse = (s: string): Uint8Array | null => {
  if (!s.trim()) return null;
  try {
    return parseHex(s);
  } catch {
    return null;
  }
};

const hexByte = (b: number): string =>
  b.toString(16).padStart(2, '0').toUpperCase();

const compare = (a: Uint8Array, b: Uint8Array): { diffs: DiffRow[]; maxLen: number } => {
  const maxLen = Math.max(a.length, b.length);
  const diffs: DiffRow[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = i < a.length ? a[i] : -1;
    const bv = i < b.length ? b[i] : -1;
    if (av !== bv) diffs.push({ offset: i, a: av, b: bv });
  }
  return { diffs, maxLen };
};

const render = (firstHex: string, secondHex: string): string => {
  const a = tryParse(firstHex);
  const b = tryParse(secondHex);
  if (!a) {
    return '错误: 第一段十六进制数据无效, 请输入有效 hex 字符串。\n示例: 7f454c46...';
  }
  if (!b) {
    return '错误: 第二段十六进制数据无效 (请在「第二段」参数中输入)。\n示例: 7f454c47...';
  }
  const { diffs, maxLen } = compare(a, b);
  const minLen = Math.min(a.length, b.length);

  const L: string[] = [];
  L.push('═══════════════════════════════════════════════════════════');
  L.push('  二进制逐字节对比');
  L.push('═══════════════════════════════════════════════════════════');
  L.push('');
  L.push(`A 长度: ${a.length} 字节`);
  L.push(`B 长度: ${b.length} 字节`);
  L.push(`对比范围: ${maxLen} 字节 (重叠区 ${minLen} 字节)`);
  L.push('');

  if (diffs.length === 0) {
    L.push('✅ 两段数据完全相同, 无差异。');
    return L.join('\n');
  }

  L.push('偏移          原始  修改');
  L.push('─'.repeat(40));
  const showMax = 500;
  diffs.slice(0, showMax).forEach((d) => {
    const off = '0x' + d.offset.toString(16).padStart(8, '0');
    const av = d.a >= 0 ? hexByte(d.a) : '--';
    const bv = d.b >= 0 ? hexByte(d.b) : '--';
    L.push(`${off}    ${av}     ${bv}`);
  });
  if (diffs.length > showMax) {
    L.push(`... (仅显示前 ${showMax} 处差异, 共 ${diffs.length} 处)`);
  }
  L.push('');

  // stats
  const same = maxLen - diffs.length;
  const similarity = maxLen > 0 ? (same / maxLen) * 100 : 100;
  L.push('───────────────────────────────────────────────────────────');
  L.push('  统计');
  L.push('───────────────────────────────────────────────────────────');
  L.push(`相同字节: ${same}`);
  L.push(`不同字节: ${diffs.length}`);
  L.push(`相似度: ${similarity.toFixed(2)}%`);
  if (a.length !== b.length) {
    L.push(`长度差异: ${Math.abs(a.length - b.length)} 字节 (${
      a.length > b.length ? 'A 较长' : 'B 较长'
    })`);
  }
  L.push('');
  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="二进制对比"
    paramsConfig={[
      {
        name: 'second_hex',
        label: '第二段',
        type: 'text',
        placeholder: '第二段 hex 数据',
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const second = (params.second_hex as string) ?? '';
      return render(input, second);
    }}
  />
);
export default ToolComponent;
