import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ON_OFF = [
  { value: '1', label: '开' },
  { value: '0', label: '关' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'length', label: '长度', type: 'text', placeholder: '16', default: '16' },
      { name: 'uppercase', label: '大写', type: 'select', default: '1', options: ON_OFF },
      { name: 'lowercase', label: '小写', type: 'select', default: '1', options: ON_OFF },
      { name: 'numbers', label: '数字', type: 'select', default: '1', options: ON_OFF },
      { name: 'symbols', label: '符号', type: 'select', default: '0', options: ON_OFF },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const length = Math.min(
        128,
        Math.max(1, parseInt((params.length as string) ?? '16', 10) || 16),
      );
      const pools: string[] = [];
      if (((params.uppercase as string) ?? '1') === '1') pools.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      if (((params.lowercase as string) ?? '1') === '1') pools.push('abcdefghijklmnopqrstuvwxyz');
      if (((params.numbers as string) ?? '1') === '1') pools.push('0123456789');
      if (((params.symbols as string) ?? '0') === '1') pools.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
      if (pools.length === 0) throw new Error('请至少选择一种字符集');
      const charset = pools.join('');
      const randIdx = new Uint32Array(length);
      crypto.getRandomValues(randIdx);
      let pwd = '';
      for (let i = 0; i < length; i++) {
        pwd += charset[randIdx[i] % charset.length];
      }
      const entropy = Math.log2(charset.length) * length;
      return [
        '=== 随机密码 ===',
        pwd,
        '',
        `长度: ${length} | 字符池: ${charset.length}`,
        `熵值: ${entropy.toFixed(2)} bits`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
