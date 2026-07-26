import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const modInverse = (a: number, m: number): number => {
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  throw new Error('参数 a 必须与 26 互素');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const a = parseInt((params.a as string) || '5', 10);
      const b = parseInt((params.b as string) || '8', 10);
      const isDecrypt = mode === 'decrypt';
      const aInv = modInverse(a, 26);
      if (isDecrypt && (a * aInv) % 26 !== 1) {
        // a and 26 must be coprime
      }
      return input.replace(/[a-z]/gi, (c: string) => {
        const base = c <= 'Z' ? 65 : 97;
        const x = c.charCodeAt(0) - base;
        let y: number;
        if (isDecrypt) {
          y = ((aInv * (x - b)) % 26 + 26) % 26;
        } else {
          y = (a * x + b) % 26;
        }
        return String.fromCharCode(y + base);
      });
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'a', label: 'a (斜率)', type: 'text', placeholder: '5', default: '5' },
      { name: 'b', label: 'b (截距)', type: 'text', placeholder: '8', default: '8' },
    ]}
  />
);

export default ToolComponent;
