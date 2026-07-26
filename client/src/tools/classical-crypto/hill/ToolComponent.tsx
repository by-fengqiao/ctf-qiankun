import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const mod = (n: number, m: number): number => ((n % m) + m) % m;

const modInverse = (a: number, m: number): number => {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return 0;
};

// 3x3 matrix inverse mod 26
const matrixInverse = (mat: number[][]): number[][] | null => {
  const det = mod(
    mat[0][0] * (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1])
      - mat[0][1] * (mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0])
      + mat[0][2] * (mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0]),
    26,
  );
  const detInv = modInverse(det, 26);
  if (detInv === 0) return null;
  const adj: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  adj[0][0] = mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1];
  adj[0][1] = -(mat[0][1] * mat[2][2] - mat[0][2] * mat[2][1]);
  adj[0][2] = mat[0][1] * mat[1][2] - mat[0][2] * mat[1][1];
  adj[1][0] = -(mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0]);
  adj[1][1] = mat[0][0] * mat[2][2] - mat[0][2] * mat[2][0];
  adj[1][2] = -(mat[0][0] * mat[1][2] - mat[0][2] * mat[1][0]);
  adj[2][0] = mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0];
  adj[2][1] = -(mat[0][0] * mat[2][1] - mat[0][1] * mat[2][0]);
  adj[2][2] = mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
  return adj.map((row: number[]) => row.map((v: number) => mod(v * detInv, 26)));
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const keyStr = ((params.key as string) || 'GYBNQKURP').toUpperCase().replace(/[^A-Z]/g, '');
      if (keyStr.length < 9) throw new Error('密钥至少需要9个字母(3x3矩阵)');
      const mat: number[][] = [];
      for (let i = 0; i < 3; i++) {
        mat.push([
          keyStr.charCodeAt(i * 3) - 65,
          keyStr.charCodeAt(i * 3 + 1) - 65,
          keyStr.charCodeAt(i * 3 + 2) - 65,
        ]);
      }
      const invMat = mode === 'decrypt' ? matrixInverse(mat) : null;
      if (mode === 'decrypt' && !invMat) throw new Error('密钥矩阵不可逆(mod 26)');
      const useMat = mode === 'decrypt' ? invMat! : mat;
      const text = input.toUpperCase().replace(/[^A-Z]/g, '');
      // Pad to multiple of 3
      const padded = text.length % 3 === 0 ? text : text + 'X'.repeat(3 - (text.length % 3));
      const result: string[] = [];
      for (let i = 0; i < padded.length; i += 3) {
        const vec = [padded.charCodeAt(i) - 65, padded.charCodeAt(i + 1) - 65, padded.charCodeAt(i + 2) - 65];
        for (let r = 0; r < 3; r++) {
          const val = mod(
            useMat[r][0] * vec[0] + useMat[r][1] * vec[1] + useMat[r][2] * vec[2],
            26,
          );
          result.push(String.fromCharCode(val + 65));
        }
      }
      return result.join('');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥(9字母)', type: 'text', placeholder: 'GYBNQKURP', default: 'GYBNQKURP' },
    ]}
  />
);

export default ToolComponent;
