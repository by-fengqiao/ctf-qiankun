import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const findKey = (ch: string): [number, number] => {
  const lower = ch.toLowerCase();
  for (let r = 0; r < ROWS.length; r++) {
    const idx = ROWS[r].indexOf(lower);
    if (idx !== -1) return [r, idx];
  }
  return [-1, -1];
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const shift = parseInt((params.shift as string) || '1', 10);
      const direction = (params.direction as string) || 'right';
      // Encrypt: shift right means move to the right on keyboard
      // Decrypt: shift left
      const isRight = mode === 'encrypt'
        ? direction === 'right'
        : direction !== 'right';
      const actualShift = isRight ? shift : -shift;
      let result = '';
      for (const ch of input) {
        if (!/[a-zA-Z]/.test(ch)) {
          result += ch;
          continue;
        }
        const [row, col] = findKey(ch);
        if (row === -1) {
          result += ch;
        } else {
          const newCol = ((col + actualShift) % ROWS[row].length + ROWS[row].length) % ROWS[row].length;
          const newCh = ROWS[row][newCol] ?? '';
          result += ch === ch.toUpperCase() && ch !== ch.toLowerCase()
            ? newCh.toUpperCase()
            : newCh;
        }
      }
      return result;
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'shift', label: '位移', type: 'text', placeholder: '1', default: '1' },
      {
        name: 'direction',
        label: '方向',
        type: 'select',
        default: 'right',
        options: [
          { value: 'right', label: '右移' },
          { value: 'left', label: '左移' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
