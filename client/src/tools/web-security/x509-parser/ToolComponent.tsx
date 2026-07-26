import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * X.509 Certificate Parser
 * Parses PEM/DER certificates, extracts TBS / extensions / pubkeys.
 * Uses atob + manual ASN.1 DER parsing (no external deps).
 * ========================================================== */

interface DerReader {
  data: number[];
  pos: number;
}

const pemToDer = (input: string): number[] => {
  const s = input.trim();
  if (s.includes('-----BEGIN')) {
    const b64 = s
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\s/g, '');
    const decoded = atob(b64);
    const bytes: number[] = [];
    for (let i = 0; i < decoded.length; i++) {
      bytes.push(decoded.charCodeAt(i));
    }
    return bytes;
  }
  // Treat as DER hex
  const hex = s.replace(/\s/g, '').replace(/0x/g, '').replace(/:/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
};

const readLen = (r: DerReader): number => {
  const b = r.data[r.pos++];
  if (b < 0x80) return b;
  const n = b & 0x7f;
  let len = 0;
  for (let i = 0; i < n; i++) {
    len = (len << 8) | r.data[r.pos++];
  }
  return len;
};

const readTag = (r: DerReader): { tag: number; len: number } => {
  const tag = r.data[r.pos++];
  const len = readLen(r);
  return { tag, len };
};

const readOID = (r: DerReader, len: number): string => {
  const oidBytes = r.data.slice(r.pos, r.pos + len);
  r.pos += len;
  let oid = '';
  const first = Math.floor(oidBytes[0] / 40);
  const second = oidBytes[0] % 40;
  oid = `${first}.${second}`;
  let val = 0;
  for (let i = 1; i < oidBytes.length; i++) {
    val = (val << 7) | (oidBytes[i] & 0x7f);
    if ((oidBytes[i] & 0x80) === 0) {
      oid += `.${val}`;
      val = 0;
    }
  }
  return oid;
};

const readString = (r: DerReader, len: number): string => {
  const s = r.data.slice(r.pos, r.pos + len);
  r.pos += len;
  return s.map((b) => String.fromCharCode(b)).join('');
};

const readInt = (r: DerReader, len: number): string => {
  const bytes = r.data.slice(r.pos, r.pos + len);
  r.pos += len;
  return '0x' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const readTime = (r: DerReader, len: number): string => {
  const s = r.data.slice(r.pos, r.pos + len);
  r.pos += len;
  return s.map((b) => String.fromCharCode(b)).join('');
};

const OID_NAMES: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.4': 'md5WithRSAEncryption',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.3.101.112': 'Ed25519',
  '2.5.4.3': 'commonName',
  '2.5.4.6': 'countryName',
  '2.5.4.7': 'localityName',
  '2.5.4.8': 'stateOrProvinceName',
  '2.5.4.10': 'organizationName',
  '2.5.4.11': 'organizationalUnitName',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.35': 'authorityKeyIdentifier',
  '1.2.840.113549.1.9.1': 'emailAddress',
};

const parseName = (r: DerReader, len: number): string => {
  const end = r.pos + len;
  const parts: string[] = [];
  while (r.pos < end) {
    const { len: setLen } = readTag(r);
    const setEnd = r.pos + setLen;
    while (r.pos < setEnd) {
      const { len: seqLen } = readTag(r);
      const { tag: oidTag, len: oidLen } = readTag(r);
      if (oidTag === 0x06) {
        const oid = readOID(r, oidLen);
        const name = OID_NAMES[oid] ?? oid;
        const { len: valLen } = readTag(r);
        const val = readString(r, valLen);
        parts.push(`${name}=${val}`);
      } else {
        r.pos += oidLen;
        const { len: valLen } = readTag(r);
        const val = readString(r, valLen);
        parts.push(`?=${val}`);
      }
    }
  }
  return parts.join(', ');
};

const parseExtensions = (r: DerReader, len: number): string[] => {
  const end = r.pos + len;
  const exts: string[] = [];
  // skip explicit context tag
  if (r.pos < end && r.data[r.pos] === 0xa3) {
    readTag(r);
  }
  const { len: seqLen } = readTag(r);
  const seqEnd = r.pos + seqLen;
  while (r.pos < seqEnd) {
    const { len: extLen } = readTag(r);
    const extEnd = r.pos + extLen;
    const { tag: oidTag, len: oidLen } = readTag(r);
    if (oidTag === 0x06) {
      const oid = readOID(r, oidLen);
      const name = OID_NAMES[oid] ?? oid;
      // Check for critical flag
      let critical = false;
      if (r.pos < extEnd && (r.data[r.pos] === 0x01 || r.data[r.pos] === 0x04)) {
        const { tag: flagTag, len: flagLen } = readTag(r);
        if (flagTag === 0x01) {
          critical = r.data[r.pos] !== 0;
          r.pos += flagLen;
          const { len: valLen } = readTag(r);
          const val = r.data.slice(r.pos, r.pos + valLen);
          r.pos += valLen;
          exts.push(`  ${name}${critical ? ' (critical)' : ''}: ${val.map((b) => b.toString(16).padStart(2, '0')).join('')}`);
        } else {
          r.pos += flagLen;
        }
      } else if (r.pos < extEnd) {
        const { len: valLen } = readTag(r);
        const val = r.data.slice(r.pos, r.pos + valLen);
        r.pos += valLen;
        exts.push(`  ${name}: ${val.map((b) => b.toString(16).padStart(2, '0')).join('')}`);
      }
    }
    r.pos = extEnd;
  }
  return exts;
};

const parseCert = (input: string): string => {
  const der = pemToDer(input);
  if (der.length < 10) {
    throw new Error('无法解析证书: 输入太短或格式不正确');
  }
  const r: DerReader = { data: der, pos: 0 };
  const lines: string[] = [];
  lines.push('── X.509 证书解析 ──');
  lines.push('');

  // Outer SEQUENCE
  const { tag: outerTag, len: outerLen } = readTag(r);
  if (outerTag !== 0x30) {
    throw new Error('无效的证书格式: 期望 SEQUENCE (0x30)');
  }

  // tbsCertificate SEQUENCE
  const { tag: tbsTag, len: tbsLen } = readTag(r);
  if (tbsTag !== 0x30) {
    throw new Error('无效的 TBS Certificate: 期望 SEQUENCE');
  }
  const tbsEnd = r.pos + tbsLen;

  // Version (explicit [0])
  let version = 'v1';
  if (r.data[r.pos] === 0xa0) {
    const { len: ctxLen } = readTag(r);
    const { len: intLen } = readTag(r);
    const v = r.data[r.pos];
    r.pos += intLen;
    version = `v${v + 1}`;
  }
  lines.push(` ▸ 版本: ${version}`);

  // Serial Number
  const { tag: serialTag, len: serialLen } = readTag(r);
  if (serialTag === 0x02) {
    const serial = readInt(r, serialLen);
    lines.push(` ▸ 序列号: ${serial}`);
  }

  // Signature Algorithm
  const { len: sigAlgLen } = readTag(r);
  const { len: oidLen } = readTag(r);
  const sigAlgOid = readOID(r, oidLen);
  // skip params if present
  if (r.pos < tbsEnd && r.data[r.pos] === 0x05) {
    const { len: nullLen } = readTag(r);
    r.pos += nullLen;
  }
  lines.push(` ▸ 签名算法: ${OID_NAMES[sigAlgOid] ?? sigAlgOid} (${sigAlgOid})`);

  // Issuer
  const { len: issuerLen } = readTag(r);
  const issuer = parseName(r, issuerLen);
  lines.push(` ▸ 颁发者 (Issuer): ${issuer}`);

  // Validity
  const { len: valLen } = readTag(r);
  const { tag: notBeforeTag, len: notBeforeLen } = readTag(r);
  const notBefore = readTime(r, notBeforeLen);
  const { tag: notAfterTag, len: notAfterLen } = readTag(r);
  const notAfter = readTime(r, notAfterLen);
  lines.push(` ▸ 有效期:`);
  lines.push(`   Not Before: ${notBefore} (${notBeforeTag === 0x17 ? 'UTCTime' : 'GeneralizedTime'})`);
  lines.push(`   Not After:  ${notAfter} (${notAfterTag === 0x17 ? 'UTCTime' : 'GeneralizedTime'})`);

  // Subject
  const { len: subjLen } = readTag(r);
  const subject = parseName(r, subjLen);
  lines.push(` ▸ 主体 (Subject): ${subject}`);

  // SubjectPublicKeyInfo
  const { len: spkiLen } = readTag(r);
  const spkiEnd = r.pos + spkiLen;
  const { len: algIdLen } = readTag(r);
  const { len: keyOidLen } = readTag(r);
  const keyAlgOid = readOID(r, keyOidLen);
  if (r.pos < spkiEnd && r.data[r.pos] === 0x05) {
    const { len: nullLen } = readTag(r);
    r.pos += nullLen;
  }
  const { len: keyLen } = readTag(r);
  const keyHex = r.data.slice(r.pos, r.pos + Math.min(keyLen, 64)).map((b) => b.toString(16).padStart(2, '0')).join('');
  r.pos = spkiEnd;
  lines.push(` ▸ 公钥信息:`);
  lines.push(`   算法: ${OID_NAMES[keyAlgOid] ?? keyAlgOid} (${keyAlgOid})`);
  lines.push(`   公钥 (前64字节): ${keyHex}${keyLen > 64 ? '...' : ''}`);

  // Extensions (if present)
  if (r.pos < tbsEnd) {
    // Skip any remaining explicit tags
    while (r.pos < tbsEnd) {
      const tag = r.data[r.pos];
      if (tag === 0xa3) {
        const { len: extCtxLen } = readTag(r);
        const exts = parseExtensions(r, extCtxLen);
        if (exts.length > 0) {
          lines.push(` ▸ 扩展 (Extensions):`);
          for (const e of exts) {
            lines.push(e);
          }
        }
      } else {
        break;
      }
    }
  }

  r.pos = tbsEnd;

  // Signature Algorithm (outer)
  const { len: sigAlg2Len } = readTag(r);
  r.pos += sigAlg2Len;

  // Signature Value
  const { tag: sigTag, len: sigValLen } = readTag(r);
  if (sigTag === 0x03) {
    r.pos++; // skip unused bits byte
    const sigHex = r.data.slice(r.pos, r.pos + Math.min(sigValLen - 1, 64))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    lines.push(` ▸ 签名值 (前64字节): ${sigHex}...`);
  }

  lines.push('');
  lines.push(' 说明:');
  lines.push('  - TBSCertificate 包含证书的核心信息 (版本/序列号/主体/公钥)');
  lines.push('  - 签名由 CA 对 TBS 的 DER 编码计算');
  lines.push('  - SAN (SubjectAltName) 扩展包含证书适用的域名/IP');
  lines.push('  - KeyUsage 定义密钥用途 (数字签名/加密/CA等)');
  lines.push('  - BasicConstraints 标识是否为 CA 证书');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="X.509证书解析"
    execute={(input: string, _mode: string, _params: Record<string, unknown>): string => {
      return parseCert(input);
    }}
  />
);
export default ToolComponent;
