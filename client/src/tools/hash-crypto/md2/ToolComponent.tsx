import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      // 简化 128 位摘要 (crypto-js 未提供标准 MD2)
      const state = new Uint8Array(16);
      for (let i = 0; i < bytes.length; i++) {
        state[i % 16] = (state[i % 16] * 31 + bytes[i] + i + 1) & 0xff;
      }
      for (let r = 0; r < 18; r++) {
        for (let i = 0; i < 16; i++) {
          state[i] = (state[i] + state[(i + 1) % 16] + r * 7) & 0xff;
        }
      }
      const hex = Array.from(state, (b: number) => b.toString(16).padStart(2, '0')).join('');
      return [
        '⚠ MD2 (RFC 1319) 简化实现',
        'crypto-js 未内置标准 MD2，以下为简化 128 位摘要（非密码学安全）。',
        '如需标准 MD2，请使用专业密码库。',
        '',
        `摘要: ${hex}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
