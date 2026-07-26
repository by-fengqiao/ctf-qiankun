import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const DTMF_TABLE: Record<string, { row: string; col: string; key: string }> = {
  '697-1209': { row: '697', col: '1209', key: '1' },
  '697-1336': { row: '697', col: '1336', key: '2' },
  '697-1477': { row: '697', col: '1477', key: '3' },
  '697-1633': { row: '697', col: '1633', key: 'A' },
  '770-1209': { row: '770', col: '1209', key: '4' },
  '770-1336': { row: '770', col: '1336', key: '5' },
  '770-1477': { row: '770', col: '1477', key: '6' },
  '770-1633': { row: '770', col: '1633', key: 'B' },
  '852-1209': { row: '852', col: '1209', key: '7' },
  '852-1336': { row: '852', col: '1336', key: '8' },
  '852-1477': { row: '852', col: '1477', key: '9' },
  '852-1633': { row: '852', col: '1633', key: 'C' },
  '941-1209': { row: '941', col: '1209', key: '*' },
  '941-1336': { row: '941', col: '1336', key: '0' },
  '941-1477': { row: '941', col: '1477', key: '#' },
  '941-1633': { row: '941', col: '1633', key: 'D' },
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '请输入 DTMF 频率对（格式: 列频,行频，用空格或换行分隔）';
      const tones = input
        .split(/[\s\n]+/)
        .filter((t: string) => t.trim().length > 0);
      const decoded: string[] = [];
      const details: string[] = [];
      for (const tone of tones) {
        const freqs = tone.split(',').map((f: string) => f.trim());
        if (freqs.length !== 2) {
          details.push(`  ${tone}: 格式错误（需要 列频,行频）`);
          continue;
        }
        const f1 = parseInt(freqs[0], 10);
        const f2 = parseInt(freqs[1], 10);
        const high = Math.max(f1, f2);
        const low = Math.min(f1, f2);
        const key = DTMF_TABLE[`${low}-${high}`];
        if (key) {
          decoded.push(key.key);
          details.push(`  ${low}Hz + ${high}Hz → "${key.key}"`);
        } else {
          decoded.push('?');
          details.push(`  ${low}Hz + ${high}Hz → 未知`);
        }
      }
      return [
        'DTMF 双音多频检测',
        `输入频率对: ${tones.length} 组`,
        '',
        '── DTMF 频率表 ──',
        '       1209Hz 1336Hz 1477Hz 1633Hz',
        '697Hz    1      2      3      A',
        '770Hz    4      5      6      B',
        '852Hz    7      8      9      C',
        '941Hz    *      0      #      D',
        '',
        '── 解码结果 ──',
        ...details,
        '',
        `拨号号码: ${decoded.join('')}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
