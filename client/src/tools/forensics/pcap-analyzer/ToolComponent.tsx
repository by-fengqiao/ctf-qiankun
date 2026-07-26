import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText, readU16BE, readU16LE, readU32BE, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Unsigned readers (avoid sign extension) ---------- */

function u32BE(b: Uint8Array, o: number): number {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}
function u32LE(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

/* ---------- Pcap structures ---------- */

interface PcapHdr {
  le: boolean;
  nano: boolean;
  major: number;
  minor: number;
  network: number;
}

interface Pkt {
  ts: number;
  data: Uint8Array;
  proto: string;
}

interface TcpFlow {
  key: string;
  count: number;
  bytes: number;
}

interface HttpMsg {
  type: string;
  method: string;
  url: string;
  status: string;
  host: string;
}

interface DnsQuery {
  domain: string;
  type: string;
}

function parseGlobalHdr(b: Uint8Array): PcapHdr | null {
  if (b.length < 24) return null;
  const m0 = b[0], m1 = b[1], m2 = b[2], m3 = b[3];
  if (m0 === 0xa1 && m1 === 0xb2 && m2 === 0xc3 && m3 === 0xd4)
    return { le: false, nano: false, major: readU16BE(b, 4), minor: readU16BE(b, 6), network: u32BE(b, 20) };
  if (m0 === 0xd4 && m1 === 0xc3 && m2 === 0xb2 && m3 === 0xa1)
    return { le: true, nano: false, major: readU16LE(b, 4), minor: readU16LE(b, 6), network: u32LE(b, 20) };
  if (m0 === 0xa1 && m1 === 0xb2 && m2 === 0x3c && m3 === 0x4d)
    return { le: false, nano: true, major: readU16BE(b, 4), minor: readU16BE(b, 6), network: u32BE(b, 20) };
  if (m0 === 0x4d && m1 === 0x3c && m2 === 0xb2 && m3 === 0xa1)
    return { le: true, nano: true, major: readU16LE(b, 4), minor: readU16LE(b, 6), network: u32LE(b, 20) };
  return null;
}

function readU32(b: Uint8Array, o: number, le: boolean): number {
  return le ? u32LE(b, o) : u32BE(b, o);
}

/* ---------- IP helpers ---------- */

function ipStr(b: Uint8Array, o: number): string {
  return `${b[o]}.${b[o + 1]}.${b[o + 2]}.${b[o + 3]}`;
}

/* ---------- DNS label parser ---------- */

function parseDnsName(data: Uint8Array, off: number): string {
  const parts: string[] = [];
  let pos = off;
  let jumps = 0;
  while (pos < data.length && jumps < 5) {
    const len = data[pos];
    if (len === 0) break;
    if ((len & 0xc0) === 0xc0) {
      if (pos + 1 >= data.length) break;
      const ptr = ((len & 0x3f) << 8) | data[pos + 1];
      pos = ptr;
      jumps++;
      continue;
    }
    pos++;
    if (pos + len > data.length) break;
    parts.push(bytesToText(data.subarray(pos, pos + len)));
    pos += len;
  }
  return parts.join('.');
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  const hdr = parseGlobalHdr(bytes);
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  PCAP 流量分析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  if (!hdr) {
    const head = Array.from(bytes.slice(0, 8))
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    L.push(`⚠️ 未检测到有效的 PCAP 魔数`);
    L.push(`  前 8 字节: ${head}`);
    L.push(`  期望魔数: a1b2c3d4 (大端) / d4c3b2a1 (小端)`);
    return L.join('\n');
  }

  L.push('── 全局头 ──');
  L.push(`  魔数: ${hdr.le ? 'd4c3b2a1 (小端)' : 'a1b2c3d4 (大端)'}`);
  L.push(`  版本: ${hdr.major}.${hdr.minor}`);
  L.push(`  时间精度: ${hdr.nano ? '纳秒' : '微秒'}`);
  L.push(`  链路类型: ${hdr.network} (${hdr.network === 1 ? 'Ethernet' : '其他'})`);
  L.push('');

  /* --- Parse packets --- */
  const packets: Pkt[] = [];
  let off = 24;
  const MAX_PKTS = 500;
  while (off + 16 <= bytes.length && packets.length < MAX_PKTS) {
    const tsSec = readU32(bytes, off, hdr.le);
    const tsFrac = readU32(bytes, off + 4, hdr.le);
    const inclLen = readU32(bytes, off + 8, hdr.le);
    const origLen = readU32(bytes, off + 12, hdr.le);
    off += 16;
    if (inclLen <= 0 || inclLen > bytes.length - off) break;
    const ts = tsSec * 1000 + (hdr.nano ? Math.floor(tsFrac / 1e6) : Math.floor(tsFrac / 1000));

    let proto = 'OTHER';
    const pktData = bytes.subarray(off, off + inclLen);
    if (hdr.network === 1 && pktData.length >= 14) {
      const ethType = (pktData[12] << 8) | pktData[13];
      if (ethType === 0x0800 && pktData.length >= 34) {
        const ipHdr = 14;
        const ipProto = pktData[ipHdr + 9];
        if (ipProto === 6) proto = 'TCP';
        else if (ipProto === 17) proto = 'UDP';
        else proto = `IP(${ipProto})`;
      } else if (ethType === 0x86dd) {
        proto = 'IPv6';
      } else if (ethType === 0x0806) {
        proto = 'ARP';
      }
    }
    packets.push({ ts, data: pktData, proto });
    off += inclLen;
  }

  L.push(`  数据包总数: ${packets.length}` + (packets.length >= MAX_PKTS ? ` (已截断，最多 ${MAX_PKTS})` : ''));
  L.push('');

  /* --- Protocol distribution --- */
  const protoCounts: Record<string, number> = {};
  for (const p of packets) protoCounts[p.proto] = (protoCounts[p.proto] ?? 0) + 1;
  L.push('── 协议分布 ──');
  for (const [k, v] of Object.entries(protoCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])) {
    const pct = ((v / packets.length) * 100).toFixed(1);
    L.push(`  ${k.padEnd(10)} ${String(v).padStart(5)}  (${pct}%)`);
  }
  L.push('');

  /* --- Packet size distribution --- */
  const sizeBuckets = { '<64': 0, '64-127': 0, '128-255': 0, '256-511': 0, '512-1023': 0, '1024+': 0 };
  for (const p of packets) {
    const s = p.data.length;
    if (s < 64) sizeBuckets['<64']++;
    else if (s < 128) sizeBuckets['64-127']++;
    else if (s < 256) sizeBuckets['128-255']++;
    else if (s < 512) sizeBuckets['256-511']++;
    else if (s < 1024) sizeBuckets['512-1023']++;
    else sizeBuckets['1024+']++;
  }
  L.push('── 包大小分布 ──');
  for (const [k, v] of Object.entries(sizeBuckets)) {
    L.push(`  ${k.padEnd(10)} ${String(v).padStart(5)}`);
  }
  L.push('');

  /* --- Timeline --- */
  if (packets.length > 0) {
    const minTs = packets[0].ts;
    const maxTs = packets[packets.length - 1].ts;
    const dur = maxTs - minTs;
    L.push('── 时间线 ──');
    L.push(`  开始: ${new Date(minTs).toISOString()}`);
    L.push(`  结束: ${new Date(maxTs).toISOString()}`);
    L.push(`  持续: ${(dur / 1000).toFixed(2)} 秒`);
    L.push('');
  }

  /* --- TCP flows --- */
  const flows = new Map<string, TcpFlow>();
  const httpMsgs: HttpMsg[] = [];
  const dnsQueries: DnsQuery[] = [];

  for (const pkt of packets) {
    if (pkt.proto !== 'TCP' && pkt.proto !== 'UDP') continue;
    const ipHdr = 14;
    if (ipHdr + 20 > pkt.data.length) continue;
    const ihl = (pkt.data[ipHdr] & 0x0f) * 4;
    const ipProto = pkt.data[ipHdr + 9];
    const srcIp = ipStr(pkt.data, ipHdr + 12);
    const dstIp = ipStr(pkt.data, ipHdr + 16);
    const l4 = ipHdr + ihl;
    if (l4 + 4 > pkt.data.length) continue;

    const srcPort = (pkt.data[l4] << 8) | pkt.data[l4 + 1];
    const dstPort = (pkt.data[l4 + 2] << 8) | pkt.data[l4 + 3];

    if (ipProto === 6) {
      const flowKey = [srcIp, srcPort, dstIp, dstPort].sort().join(':');
      const existing = flows.get(flowKey);
      if (existing) {
        existing.count++;
        existing.bytes += pkt.data.length;
      } else {
        flows.set(flowKey, { key: `${srcIp}:${srcPort} → ${dstIp}:${dstPort}`, count: 1, bytes: pkt.data.length });
      }

      const tcpHdrLen = ((pkt.data[l4 + 12] >> 4) & 0x0f) * 4;
      const payloadStart = l4 + tcpHdrLen;
      if (payloadStart < pkt.data.length) {
        const payload = pkt.data.subarray(payloadStart);
        const text = bytesToText(payload);
        const trimmed = text.trimStart();
        const httpMatch = trimmed.match(/^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+(\S+)/i);
        if (httpMatch) {
          const hostMatch = text.match(/Host:\s*(\S+)/i);
          httpMsgs.push({ type: '请求', method: httpMatch[1], url: httpMatch[2], status: '', host: hostMatch?.[1] ?? '' });
        } else if (trimmed.startsWith('HTTP/')) {
          const statusLine = trimmed.split('\r\n')[0];
          httpMsgs.push({ type: '响应', method: '', url: '', status: statusLine, host: '' });
        }
      }
    }

    if (ipProto === 17 && (srcPort === 53 || dstPort === 53)) {
      const dnsHdr = l4 + 8;
      if (dnsHdr + 12 <= pkt.data.length) {
        const qdcount = (pkt.data[dnsHdr + 4] << 8) | pkt.data[dnsHdr + 5];
        if (qdcount > 0) {
          const name = parseDnsName(pkt.data, dnsHdr + 12);
          if (name) {
            const qTypeOff = dnsHdr + 12 + name.length + 2;
            let qType = '?';
            if (qTypeOff + 2 <= pkt.data.length) {
              const qt = (pkt.data[qTypeOff] << 8) | pkt.data[qTypeOff + 1];
              if (qt === 1) qType = 'A';
              else if (qt === 28) qType = 'AAAA';
              else if (qt === 15) qType = 'MX';
              else if (qt === 16) qType = 'TXT';
              else if (qt === 2) qType = 'NS';
              else if (qt === 5) qType = 'CNAME';
            }
            dnsQueries.push({ domain: name, type: qType });
          }
        }
      }
    }
  }

  /* --- TCP flow summary --- */
  L.push('── TCP 流 (Top 10) ──');
  const flowList = Array.from(flows.values()).sort((a: TcpFlow, b: TcpFlow) => b.bytes - a.bytes);
  const flowShown = Math.min(10, flowList.length);
  if (flowShown === 0) {
    L.push('  未发现 TCP 流');
  } else {
    L.push(`  共 ${flows.size} 条流，显示前 ${flowShown} 条:`);
    L.push('');
    for (let i = 0; i < flowShown; i++) {
      const f = flowList[i];
      L.push(`  [${i + 1}] ${f.key}`);
      L.push(`      包数: ${f.count}  字节: ${f.bytes}`);
    }
  }
  L.push('');

  /* --- HTTP --- */
  L.push('── HTTP 请求/响应 ──');
  if (httpMsgs.length === 0) {
    L.push('  未发现 HTTP 流量');
  } else {
    const max = Math.min(20, httpMsgs.length);
    L.push(`  共 ${httpMsgs.length} 条，显示前 ${max} 条:`);
    L.push('');
    for (let i = 0; i < max; i++) {
      const m = httpMsgs[i];
      if (m.type === '请求') {
        L.push(`  [${i + 1}] 请求 ${m.method} ${m.url}` + (m.host ? `  Host: ${m.host}` : ''));
      } else {
        L.push(`  [${i + 1}] 响应 ${m.status}`);
      }
    }
  }
  L.push('');

  /* --- DNS --- */
  L.push('── DNS 查询 ──');
  if (dnsQueries.length === 0) {
    L.push('  未发现 DNS 查询');
  } else {
    const max = Math.min(20, dnsQueries.length);
    L.push(`  共 ${dnsQueries.length} 条，显示前 ${max} 条:`);
    L.push('');
    for (let i = 0; i < max; i++) {
      const q = dnsQueries[i];
      L.push(`  [${i + 1}] ${q.domain}  (类型: ${q.type})`);
    }
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="PCAP流量分析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 2 * 1024 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
