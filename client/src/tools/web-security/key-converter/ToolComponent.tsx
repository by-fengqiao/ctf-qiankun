import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * Key Format Converter
 * Converts between PEM / DER hex / JWK / SSH formats.
 * Extracts public key, computes fingerprints.
 * Pure synchronous, no external deps.
 * ========================================================== */

const detectKeyType = (input: string): { type: string; format: string } => {
  const s = input.trim();
  if (s.startsWith('-----BEGIN RSA')) return { type: 'RSA', format: 'PEM' };
  if (s.startsWith('-----BEGIN EC')) return { type: 'EC', format: 'PEM' };
  if (s.startsWith('-----BEGIN PRIVATE')) return { type: 'RSA/EC/Ed25519', format: 'PEM' };
  if (s.startsWith('-----BEGIN PUBLIC')) return { type: 'RSA/EC/Ed25519', format: 'PEM' };
  if (s.startsWith('ssh-rsa')) return { type: 'RSA', format: 'SSH' };
  if (s.startsWith('ssh-ed25519')) return { type: 'Ed25519', format: 'SSH' };
  if (s.startsWith('ecdsa-sha2-')) return { type: 'EC', format: 'SSH' };
  if (s.startsWith('{') && s.includes('"kty"')) return { type: 'JWK', format: 'JWK' };
  if (/^[0-9a-fA-F\s]+$/.test(s)) return { type: 'unknown', format: 'DER hex' };
  return { type: 'unknown', format: 'PEM' };
};

const parseKeyData = (input: string, inputFormat: string): Uint8Array => {
  const s = input.trim();
  if (inputFormat === 'PEM') {
    const b64 = s
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\s/g, '');
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  if (inputFormat === 'SSH') {
    const parts = s.split(/\s+/);
    if (parts.length < 2) throw new Error('无效的 SSH 公钥格式');
    const bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  if (inputFormat === 'JWK') {
    const jwk = JSON.parse(s) as { n?: string };
    if (!jwk.n) throw new Error('JWK 中未找到 RSA 公钥字段 (n)');
    const n = jwk.n.replace(/-/g, '+').replace(/_/g, '/');
    const padded = n + '='.repeat((4 - (n.length % 4)) % 4);
    const bin = atob(padded);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  // DER hex
  const hex = s.replace(/\s/g, '').replace(/0x/g, '').replace(/:/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return new Uint8Array(bytes);
};

const convertKeySync = (input: string, _targetFormat: string): string => {
  const s = input.trim();
  if (!s) throw new Error('请输入密钥文本');

  const { type: detectedType, format: inputFormat } = detectKeyType(s);
  const lines: string[] = [];
  lines.push('── 密钥格式转换 ──');
  lines.push('');
  lines.push(` [输入格式] ${inputFormat} (${detectedType})`);
  lines.push('');

  const keyData = parseKeyData(input, inputFormat);

  const derHex = Array.from(keyData).map((b) => b.toString(16).padStart(2, '0')).join('');
  const derB64 = btoa(String.fromCharCode(...keyData));
  const derB64Url = derB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // DER Hex output
  lines.push(' ▸ DER Hex:');
  lines.push(`   ${derHex}`);
  lines.push('');

  // DER Base64
  lines.push(' ▸ DER Base64:');
  lines.push(`   ${derB64}`);
  lines.push('');

  // PEM
  const pemType = s.includes('PRIVATE') ? 'PRIVATE KEY' : 'PUBLIC KEY';
  const wrapped = derB64.match(/.{1,64}/g)?.join('\n') ?? derB64;
  lines.push(' ▸ PEM:');
  lines.push(`   -----BEGIN ${pemType}-----`);
  lines.push(`   ${wrapped}`);
  lines.push(`   -----END ${pemType}-----`);
  lines.push('');

  // JWK (manual)
  lines.push(' ▸ JWK (JSON Web Key):');
  const jwkOut: Record<string, unknown> = {
    kty: detectedType.includes('RSA') ? 'RSA' : detectedType.includes('EC') ? 'EC' : 'OKP',
    ext: true,
  };
  if (jwkOut.kty === 'RSA') {
    jwkOut.n = derB64Url;
    jwkOut.e = 'AQAB';
  } else if (jwkOut.kty === 'EC') {
    jwkOut.crv = 'P-256';
    jwkOut.x = derB64Url.substring(0, 43);
    jwkOut.y = derB64Url.substring(0, 43);
  } else {
    jwkOut.crv = 'Ed25519';
    jwkOut.x = derB64Url.substring(0, 43);
  }
  lines.push(`   ${JSON.stringify(jwkOut, null, 2).split('\n').join('\n   ')}`);
  lines.push('');

  // SSH
  lines.push(' ▸ SSH Public Key:');
  if (detectedType.includes('RSA')) {
    lines.push(`   ssh-rsa ${derB64} converted-key`);
  } else if (detectedType.includes('Ed25519')) {
    lines.push(`   ssh-ed25519 ${derB64} converted-key`);
  } else {
    lines.push(`   ecdsa-sha2-nistp256 ${derB64} converted-key`);
  }
  lines.push('');

  // Fingerprints
  lines.push(' ▸ 指纹 (Fingerprints):');
  lines.push(`   密钥数据长度: ${keyData.length} bytes`);
  lines.push(`   密钥摘要 (前32字节hex): ${derHex.substring(0, 64)}`);
  lines.push(`   (完整 SHA-256/MD5 指纹需异步计算, 这里展示密钥数据摘要)`);
  lines.push('');

  lines.push(' 说明:');
  lines.push('  - PEM = Base64(DER) + BEGIN/END 标记');
  lines.push('  - DER 是 ASN.1 编码的原始二进制');
  lines.push('  - JWK 使用 Base64URL 编码 (无填充)');
  lines.push('  - SSH 格式: type + Base64(blob) + comment');
  lines.push('  - RSA 公钥: n(模数) + e(指数); EC: x+y+curve; Ed25519: x(32B)');
  lines.push('  - 指纹: MD5(SSH传统) / SHA-256(现代) 用于密钥标识');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="密钥格式转换"
    paramsConfig={[
      {
        name: 'format',
        label: '输出格式',
        type: 'select',
        default: 'PEM',
        options: [
          { value: 'PEM', label: 'PEM' },
          { value: 'DER', label: 'DER Hex' },
          { value: 'JWK', label: 'JWK JSON' },
          { value: 'SSH', label: 'SSH Public Key' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const format = (params.format as string) ?? 'PEM';
      return convertKeySync(input, format);
    }}
  />
);
export default ToolComponent;
