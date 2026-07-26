import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16BE, readU32BE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- TLS constants ---------- */

const TLS_CONTENT_TYPES: Record<number, string> = {
  20: 'ChangeCipherSpec',
  21: 'Alert',
  22: 'Handshake',
  23: 'Application Data',
  24: 'Heartbeat',
};

const TLS_VERSIONS: Record<number, string> = {
  0x0300: 'SSL 3.0',
  0x0301: 'TLS 1.0',
  0x0302: 'TLS 1.1',
  0x0303: 'TLS 1.2',
  0x0304: 'TLS 1.3',
};

const HANDSHAKE_TYPES: Record<number, string> = {
  0: 'HelloRequest',
  1: 'ClientHello',
  2: 'ServerHello',
  4: 'NewSessionTicket',
  8: 'EncryptedExtensions',
  11: 'Certificate',
  12: 'ServerKeyExchange',
  13: 'CertificateRequest',
  14: 'ServerHelloDone',
  15: 'CertificateVerify',
  16: 'ClientKeyExchange',
  20: 'Finished',
};

const CIPHER_SUITES: Record<number, string> = {
  0x0000: 'TLS_NULL_WITH_NULL_NULL',
  0x002f: 'TLS_RSA_WITH_AES_128_CBC_SHA',
  0x0035: 'TLS_RSA_WITH_AES_256_CBC_SHA',
  0x003c: 'TLS_RSA_WITH_AES_128_CBC_SHA256',
  0x003d: 'TLS_RSA_WITH_AES_256_CBC_SHA256',
  0x009c: 'TLS_RSA_WITH_AES_128_GCM_SHA256',
  0x009d: 'TLS_RSA_WITH_AES_256_GCM_SHA384',
  0xc02f: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  0xc030: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  0xc02b: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
  0xc02c: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
  0xc027: 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256',
  0xc028: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384',
  0xcca9: 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
  0xcca8: 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
  0x1301: 'TLS_AES_128_GCM_SHA256',
  0x1302: 'TLS_AES_256_GCM_SHA384',
  0x1303: 'TLS_CHACHA20_POLY1305_SHA256',
};

const EXT_TYPES: Record<number, string> = {
  0: 'server_name (SNI)',
  5: 'status_request (OCSP)',
  10: 'supported_groups',
  11: 'ec_point_formats',
  13: 'signature_algorithms',
  16: 'application_layer_protocol_negotiation (ALPN)',
  18: 'signed_certificate_timestamp',
  21: 'padding',
  22: 'encrypt_then_mac',
  23: 'extended_master_secret',
  27: 'compress_certificate',
  35: 'session_ticket',
  41: 'pre_shared_key',
  43: 'supported_versions',
  51: 'key_share',
  65281: 'renegotiation_info',
};

/* ---------- Helpers ---------- */

function readBytes(bytes: Uint8Array, offset: number, len: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < len && offset + i < bytes.length; i++) {
    result.push(bytes[offset + i]);
  }
  return result;
}

function bytesToHexStr(bytes: Uint8Array, offset: number, len: number): string {
  const parts: string[] = [];
  for (let i = 0; i < len && offset + i < bytes.length; i++) {
    parts.push(bytes[offset + i].toString(16).padStart(2, '0').toUpperCase());
  }
  return parts.join(':');
}

function versionName(code: number): string {
  return TLS_VERSIONS[code] ?? `0x${code.toString(16).padStart(4, '0')}`;
}

function contentTypeName(code: number): string {
  return TLS_CONTENT_TYPES[code] ?? `Unknown(0x${code.toString(16)})`;
}

function handshakeTypeName(code: number): string {
  return HANDSHAKE_TYPES[code] ?? `Unknown(0x${code.toString(16)})`;
}

function cipherName(code: number): string {
  return CIPHER_SUITES[code] ?? `0x${code.toString(16).padStart(4, '0')}`;
}

function extTypeName(code: number): string {
  return EXT_TYPES[code] ?? `Unknown(0x${code.toString(16)})`;
}

/* ---------- Parsers ---------- */

interface TLSRecord {
  contentType: number;
  contentTypeName: string;
  version: number;
  versionName: string;
  length: number;
  offset: number;
}

function parseRecords(bytes: Uint8Array): TLSRecord[] {
  const records: TLSRecord[] = [];
  let offset = 0;
  while (offset + 5 <= bytes.length) {
    const contentType = bytes[offset];
    const version = readU16BE(bytes, offset + 1);
    const length = readU16BE(bytes, offset + 3);
    records.push({
      contentType,
      contentTypeName: contentTypeName(contentType),
      version,
      versionName: versionName(version),
      length,
      offset,
    });
    offset += 5 + length;
    if (length === 0) break; // avoid infinite loop
  }
  return records;
}

interface ClientHelloInfo {
  version: string;
  random: string;
  sessionId: string;
  cipherSuites: string[];
  extensions: { type: string; data: string }[];
  sni: string;
}

function parseClientHello(bytes: Uint8Array, offset: number, length: number): ClientHelloInfo {
  const end = offset + length;
  const hsType = bytes[offset];
  // Handshake length: 3 bytes
  let pos = offset + 4;
  const version = readU16BE(bytes, pos);
  pos += 2;
  const random = bytesToHexStr(bytes, pos, 32);
  pos += 32;
  const sessionIdLen = bytes[pos];
  pos += 1;
  const sessionId = bytesToHexStr(bytes, pos, sessionIdLen);
  pos += sessionIdLen;
  const cipherSuitesLen = readU16BE(bytes, pos);
  pos += 2;
  const cipherSuites: string[] = [];
  for (let i = 0; i < cipherSuitesLen; i += 2) {
    const cs = readU16BE(bytes, pos + i);
    cipherSuites.push(`${cipherName(cs)} (0x${cs.toString(16).padStart(4, '0')})`);
  }
  pos += cipherSuitesLen;
  // Compression methods
  if (pos < end) {
    const compLen = bytes[pos];
    pos += 1 + compLen;
  }
  // Extensions
  const extensions: { type: string; data: string }[] = [];
  let sni = '(无)';
  if (pos + 2 <= end) {
    const extLen = readU16BE(bytes, pos);
    pos += 2;
    const extEnd = pos + extLen;
    while (pos + 4 <= extEnd && pos + 4 <= bytes.length) {
      const extType = readU16BE(bytes, pos);
      const extDataLen = readU16BE(bytes, pos + 2);
      pos += 4;
      const extData = bytesToHexStr(bytes, pos, Math.min(extDataLen, 32));
      extensions.push({ type: extTypeName(extType), data: extData });
      // Parse SNI (type 0)
      if (extType === 0 && pos + 5 < bytes.length) {
        const sniListLen = readU16BE(bytes, pos);
        if (sniListLen > 0 && pos + 5 < bytes.length) {
          const sniType = bytes[pos + 2];
          const sniLen = readU16BE(bytes, pos + 3);
          if (sniType === 0 && pos + 5 + sniLen <= bytes.length) {
            const sniBytes = readBytes(bytes, pos + 5, sniLen);
            sni = sniBytes.map((b: number) => String.fromCharCode(b)).join('');
          }
        }
      }
      pos += extDataLen;
    }
  }
  return {
    version: versionName(version),
    random,
    sessionId,
    cipherSuites,
    extensions,
    sni,
  };
}

interface CertInfo {
  certChain: string[];
  totalCerts: number;
}

function parseCertificate(bytes: Uint8Array, offset: number, length: number): CertInfo {
  // Certificate message: 1 byte handshake type, 3 bytes length, 3 bytes total certs length
  let pos = offset + 4 + 3; // skip hs type + hs length + certs length
  const end = offset + length;
  const certs: string[] = [];
  let count = 0;
  while (pos + 3 <= end && pos + 3 <= bytes.length) {
    let certLen = (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
    pos += 3;
    if (certLen === 0 || pos + certLen > bytes.length) break;
    // Extract subject/issuer from cert is complex; show hash of cert
    const certHash = bytesToHexStr(bytes, pos, 20);
    certs.push(`证书 #${count + 1}: SHA1前20字节=${certHash}, 长度=${certLen}`);
    count++;
    pos += certLen;
  }
  return { certChain: certs, totalCerts: count };
}

interface KeyExchangeInfo {
  params: string;
}

function parseServerKeyExchange(bytes: Uint8Array, offset: number, length: number): KeyExchangeInfo {
  // Simplified: extract DH/ECDH params
  const end = offset + length;
  let pos = offset + 4; // skip handshake header
  const params: string[] = [];
  if (pos < end) {
    const kType = bytes[pos];
    if (kType === 0x03) {
      // ECParameters
      pos += 1;
      if (pos + 1 < end) {
        const curveType = bytes[pos];
        pos += 1;
        if (curveType === 0x03 && pos + 2 <= end) {
          const namedCurve = readU16BE(bytes, pos);
          params.push(`ECDHE: 命名曲线=0x${namedCurve.toString(16).padStart(4, '0')}`);
          pos += 2;
          if (pos + 1 < end) {
            const pubKeyLen = bytes[pos];
            pos += 1;
            const pubKey = bytesToHexStr(bytes, pos, Math.min(pubKeyLen, 32));
            params.push(`公钥长度: ${pubKeyLen}, 公钥前缀: ${pubKey}`);
          }
        }
      }
    } else {
      // DH params: p_len(2) + p + g_len(2) + g + pubkey_len(2) + pubkey
      if (pos + 2 <= end) {
        const pLen = readU16BE(bytes, pos);
        pos += 2 + pLen;
        params.push(`DH: p长度=${pLen}`);
        if (pos + 2 <= end) {
          const gLen = readU16BE(bytes, pos);
          pos += 2 + gLen;
          params.push(`DH: g长度=${gLen}`);
          if (pos + 2 <= end) {
            const yLen = readU16BE(bytes, pos);
            params.push(`DH: 公钥长度=${yLen}`);
          }
        }
      }
    }
  }
  return { params: params.join(', ') || '(无法解析)' };
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 5) throw new Error('数据过短，至少需要 5 字节 TLS 记录头');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  TLS 握手解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const records = parseRecords(bytes);
  L.push(`找到 TLS 记录: ${records.length} 个`);
  L.push('');

  L.push('── TLS 记录层 ──');
  records.forEach((r: TLSRecord, i: number) => {
    L.push(`[${i + 1}] ${r.contentTypeName} | 版本=${r.versionName} | 长度=${r.length}`);
  });
  L.push('');

  let helloFound = false;
  let certFound = false;
  let keyExchFound = false;

  records.forEach((r: TLSRecord, idx: number) => {
    if (r.contentType !== 22) return; // Handshake only
    const hsOffset = r.offset + 5;
    if (hsOffset >= bytes.length) return;
    const hsType = bytes[hsOffset];
    const hsName = handshakeTypeName(hsType);

    if (hsType === 1 || hsType === 2) {
      // ClientHello or ServerHello
      helloFound = true;
      L.push(`── ${hsName} ──`);
      try {
        const hello = parseClientHello(bytes, hsOffset, r.length);
        L.push(`  版本: ${hello.version}`);
        L.push(`  Random: ${hello.random}`);
        L.push(`  Session ID: ${hello.sessionId || '(空)'}`);
        if (hsType === 1) {
          L.push(`  密码套件 (${hello.cipherSuites.length} 个):`);
          hello.cipherSuites.forEach((cs: string) => {
            L.push(`    - ${cs}`);
          });
        } else {
          // ServerHello: first cipher suite is selected
          L.push(`  选定密码套件: ${hello.cipherSuites[0] ?? '(无)'}`);
        }
        if (hello.sni !== '(无)') {
          L.push(`  SNI: ${hello.sni}`);
        }
        if (hello.extensions.length > 0) {
          L.push(`  扩展 (${hello.extensions.length} 个):`);
          hello.extensions.slice(0, 10).forEach((e: { type: string; data: string }) => {
            L.push(`    - ${e.type}`);
          });
          if (hello.extensions.length > 10) {
            L.push(`    ... 共 ${hello.extensions.length} 个`);
          }
        }
      } catch {
        L.push('  (解析失败)');
      }
      L.push('');
    } else if (hsType === 11) {
      // Certificate
      certFound = true;
      L.push(`── ${hsName} ──`);
      try {
        const cert = parseCertificate(bytes, hsOffset, r.length);
        L.push(`  证书链: ${cert.totalCerts} 个证书`);
        cert.certChain.forEach((c: string) => {
          L.push(`  - ${c}`);
        });
      } catch {
        L.push('  (解析失败)');
      }
      L.push('');
    } else if (hsType === 12) {
      // ServerKeyExchange
      keyExchFound = true;
      L.push(`── ${hsName} ──`);
      try {
        const kex = parseServerKeyExchange(bytes, hsOffset, r.length);
        L.push(`  密钥交换参数: ${kex.params}`);
      } catch {
        L.push('  (解析失败)');
      }
      L.push('');
    } else {
      L.push(`── [${idx + 1}] ${hsName} ──`);
      L.push(`  (长度 ${r.length} 字节)`);
      L.push('');
    }
  });

  L.push('── 摘要 ──');
  L.push(`  TLS 记录数: ${records.length}`);
  L.push(`  Hello 消息: ${helloFound ? '✓' : '✗'}`);
  L.push(`  证书消息: ${certFound ? '✓' : '✗'}`);
  L.push(`  密钥交换: ${keyExchFound ? '✓' : '✗'}`);
  L.push('');
  L.push('── 备注 ──');
  L.push('  本工具解析明文 TLS 握手数据');
  L.push('  TLS 1.3 中握手在加密后进行，仅 ClientHello 可见');
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="TLS握手解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 256 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
