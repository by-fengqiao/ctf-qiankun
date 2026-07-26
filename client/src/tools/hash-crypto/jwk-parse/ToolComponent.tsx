import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const base64UrlDecode = (str: string): string => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return atob(s);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const jwk = JSON.parse(input.trim());
      const kty = jwk.kty ?? 'unknown';
      const lines = [
        '=== JWK Info ===',
        `Key Type (kty): ${kty}`,
      ];
      if (jwk.key_ops) lines.push(`Key Operations: ${Array.isArray(jwk.key_ops) ? jwk.key_ops.join(', ') : jwk.key_ops}`);
      if (jwk.ext !== undefined) lines.push(`Extractable: ${jwk.ext}`);
      if (jwk.alg) lines.push(`Algorithm: ${jwk.alg}`);
      if (jwk.kid) lines.push(`Key ID: ${jwk.kid}`);
      if (jwk.use) lines.push(`Use: ${jwk.use}`);
      lines.push('', '=== Components ===');
      if (kty === 'RSA') {
        if (jwk.n) lines.push(`n (modulus): ${jwk.n} (${Math.floor(base64UrlDecode(jwk.n).length * 8)} bits)`);
        if (jwk.e) lines.push(`e (exponent): ${jwk.e} (${base64UrlDecode(jwk.e)})`);
        if (jwk.d) lines.push(`d (private exponent): ${jwk.d}`);
        if (jwk.p) lines.push(`p: ${jwk.p}`);
        if (jwk.q) lines.push(`q: ${jwk.q}`);
        if (jwk.dp) lines.push(`dp: ${jwk.dp}`);
        if (jwk.dq) lines.push(`dq: ${jwk.dq}`);
        if (jwk.qi) lines.push(`qi: ${jwk.qi}`);
      } else if (kty === 'EC') {
        if (jwk.crv) lines.push(`Curve: ${jwk.crv}`);
        if (jwk.x) lines.push(`x: ${jwk.x}`);
        if (jwk.y) lines.push(`y: ${jwk.y}`);
        if (jwk.d) lines.push(`d (private): ${jwk.d}`);
      } else if (kty === 'oct') {
        if (jwk.k) lines.push(`k (key): ${jwk.k} (${Math.floor(base64UrlDecode(jwk.k).length * 8)} bits)`);
      } else if (kty === 'OKP') {
        if (jwk.crv) lines.push(`Curve: ${jwk.crv}`);
        if (jwk.x) lines.push(`x: ${jwk.x}`);
        if (jwk.d) lines.push(`d (private): ${jwk.d}`);
      }
      lines.push('', '=== Raw JWK ===', JSON.stringify(jwk, null, 2));
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
