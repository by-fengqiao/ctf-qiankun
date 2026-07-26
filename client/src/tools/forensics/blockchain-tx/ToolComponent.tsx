import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16LE, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

type RLPItem = Uint8Array | RLPItem[];

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 7; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

function readVarInt(bytes: Uint8Array, offset: number): { value: number; consumed: number } {
  const prefix = bytes[offset];
  if (prefix < 0xfd) return { value: prefix, consumed: 1 };
  if (prefix === 0xfd) return { value: readU16LE(bytes, offset + 1), consumed: 3 };
  if (prefix === 0xfe) return { value: readU32LE(bytes, offset + 1) >>> 0, consumed: 5 };
  const lo = readU32LE(bytes, offset + 1) >>> 0;
  const hi = readU32LE(bytes, offset + 5) >>> 0;
  return { value: lo + hi * 0x100000000, consumed: 9 };
}

function toHex(bytes: Uint8Array, start: number, end: number): string {
  const parts: string[] = [];
  for (let i = start; i < end; i++) {
    parts.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return parts.join('');
}

function toHexReversed(bytes: Uint8Array, start: number, length: number): string {
  const parts: string[] = [];
  for (let i = start + length - 1; i >= start; i--) {
    parts.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return parts.join('');
}

function decodeScript(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[23] === 0x88 && script[24] === 0xac) {
    const hash = toHex(script, 3, 23);
    return `P2PKH (Pay-to-Public-Key-Hash)\\n    Hash160: ${hash}`;
  }
  if (script.length === 23 && script[0] === 0xa9 && script[22] === 0x87) {
    const hash = toHex(script, 2, 22);
    return `P2SH (Pay-to-Script-Hash)\\n    Hash160: ${hash}`;
  }
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
    const hash = toHex(script, 2, 22);
    return `P2WPKH (Pay-to-Witness-Public-Key-Hash)\\n    Hash160: ${hash}`;
  }
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
    const hash = toHex(script, 2, 34);
    return `P2WSH (Pay-to-Witness-Script-Hash)\\n    Hash: ${hash}`;
  }
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
    const hash = toHex(script, 2, 34);
    return `P2TR (Pay-to-Taproot)\\n    X-only pubkey: ${hash}`;
  }
  return `Unknown (raw, ${script.length} bytes)\\n    ${toHex(script, 0, Math.min(script.length, 50))}`;
}

function rlpDecode(data: Uint8Array, offset: number): { item: RLPItem; consumed: number } {
  if (offset >= data.length) throw new Error('RLP: unexpected end of data');
  const prefix = data[offset];
  
  if (prefix <= 0x7f) {
    return { item: data.subarray(offset, offset + 1), consumed: 1 };
  }
  
  if (prefix <= 0xb7) {
    const len = prefix - 0x80;
    if (offset + 1 + len > data.length) throw new Error('RLP: string out of bounds');
    return { item: data.subarray(offset + 1, offset + 1 + len), consumed: 1 + len };
  }
  
  if (prefix <= 0xbf) {
    const lenLen = prefix - 0xb7;
    if (offset + 1 + lenLen > data.length) throw new Error('RLP: length bytes out of bounds');
    let len = 0;
    for (let i = 0; i < lenLen; i++) {
      len = (len << 8) | data[offset + 1 + i];
    }
    const start = offset + 1 + lenLen;
    if (start + len > data.length) throw new Error('RLP: long string out of bounds');
    return { item: data.subarray(start, start + len), consumed: 1 + lenLen + len };
  }
  
  if (prefix <= 0xf7) {
    const len = prefix - 0xc0;
    const end = offset + 1 + len;
    if (end > data.length) throw new Error('RLP: list out of bounds');
    const items: RLPItem[] = [];
    let pos = offset + 1;
    while (pos < end) {
      const { item, consumed } = rlpDecode(data, pos);
      items.push(item);
      pos += consumed;
    }
    return { item: items, consumed: 1 + len };
  }
  
  const lenLen = prefix - 0xf7;
  if (offset + 1 + lenLen > data.length) throw new Error('RLP: list length bytes out of bounds');
  let len = 0;
  for (let i = 0; i < lenLen; i++) {
    len = (len << 8) | data[offset + 1 + i];
  }
  const start = offset + 1 + lenLen;
  const end = start + len;
  if (end > data.length) throw new Error('RLP: long list out of bounds');
  const items: RLPItem[] = [];
  let pos = start;
  while (pos < end) {
    const { item, consumed } = rlpDecode(data, pos);
    items.push(item);
    pos += consumed;
  }
  return { item: items, consumed: end - offset };
}

function rlpToBigInt(item: Uint8Array): bigint {
  if (item.length === 0) return 0n;
  let val = 0n;
  for (let i = 0; i < item.length; i++) {
    val = (val << 8n) | BigInt(item[i]);
  }
  return val;
}

function rlpToHex(item: Uint8Array): string {
  if (item.length === 0) return '0x0';
  return '0x' + toHex(item, 0, item.length);
}

function parseBitcoinTx(bytes: Uint8Array): string {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Bitcoin 交易解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  
  let pos = 0;
  const version = readU32LE(bytes, pos) >>> 0;
  pos += 4;
  L.push(`版本: ${version}`);
  
  let isSegWit = false;
  if (pos < bytes.length && bytes[pos] === 0x00 && bytes[pos + 1] === 0x01) {
    isSegWit = true;
    pos += 2;
    L.push('SegWit: 是');
  } else {
    L.push('SegWit: 否');
  }
  
  const { value: inputCount, consumed: icConsumed } = readVarInt(bytes, pos);
  pos += icConsumed;
  L.push(`输入数量: ${inputCount}`);
  L.push('');
  
  for (let i = 0; i < inputCount; i++) {
    if (pos + 36 > bytes.length) break;
    L.push(`── 输入 #${i + 1} ──`);
    const txid = toHexReversed(bytes, pos, 32);
    pos += 32;
    const vout = readU32LE(bytes, pos) >>> 0;
    pos += 4;
    const { value: scriptLen, consumed: slConsumed } = readVarInt(bytes, pos);
    pos += slConsumed;
    const scriptSig = bytes.subarray(pos, pos + scriptLen);
    pos += scriptLen;
    const sequence = readU32LE(bytes, pos) >>> 0;
    pos += 4;
    
    L.push(`  引用交易: ${txid}:${vout}`);
    L.push(`  序列: 0x${sequence.toString(16).padStart(8, '0')}`);
    L.push(`  签名脚本 (${scriptLen} 字节):`);
    L.push(`    ${decodeScript(scriptSig)}`);
    L.push('');
  }
  
  const { value: outputCount, consumed: ocConsumed } = readVarInt(bytes, pos);
  pos += ocConsumed;
  L.push(`输出数量: ${outputCount}`);
  L.push('');
  
  for (let i = 0; i < outputCount; i++) {
    if (pos + 8 > bytes.length) break;
    L.push(`── 输出 #${i + 1} ──`);
    const value = readU64LE(bytes, pos);
    pos += 8;
    const { value: scriptLen, consumed: slConsumed } = readVarInt(bytes, pos);
    pos += slConsumed;
    const scriptPubKey = bytes.subarray(pos, pos + scriptLen);
    pos += scriptLen;
    
    L.push(`  金额: ${value} 聪 (${Number(value) / 1e8} BTC)`);
    L.push(`  公钥脚本 (${scriptLen} 字节):`);
    L.push(`    ${decodeScript(scriptPubKey)}`);
    L.push('');
  }
  
  if (isSegWit) {
    L.push('── Witness 数据 ──');
    for (let i = 0; i < inputCount; i++) {
      if (pos >= bytes.length) break;
      const { value: witnessCount, consumed: wcConsumed } = readVarInt(bytes, pos);
      pos += wcConsumed;
      L.push(`  输入 #${i + 1} Witness: ${witnessCount} 项`);
      for (let w = 0; w < witnessCount; w++) {
        const { value: witnessLen, consumed: wlConsumed } = readVarInt(bytes, pos);
        pos += wlConsumed;
        const witness = bytes.subarray(pos, pos + witnessLen);
        pos += witnessLen;
        L.push(`    [${w + 1}] ${witnessLen} bytes: ${toHex(witness, 0, Math.min(witnessLen, 64))}`);
      }
    }
    L.push('');
  }
  
  const locktime = readU32LE(bytes, pos) >>> 0;
  pos += 4;
  L.push(`Locktime: ${locktime}${locktime < 500000000 ? ' (块高度)' : ' (Unix 时间)'}`);
  L.push('');
  
  L.push(`总大小: ${pos} 字节`);
  return L.join('\\n');
}

function parseEthereumTx(bytes: Uint8Array): string {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Ethereum 交易解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  
  const { item: rlpItems, consumed } = rlpDecode(bytes, 0);
  if (!Array.isArray(rlpItems)) {
    throw new Error('无效的 Ethereum 交易（非 RLP 列表）');
  }
  
  if (rlpItems.length !== 9) {
    throw new Error(`无效的 Ethereum 交易（期望 9 项，实际 ${rlpItems.length} 项）`);
  }
  
  const [nonceBuf, gasPriceBuf, gasLimitBuf, toBuf, valueBuf, dataBuf, vBuf, rBuf, sBuf] = rlpItems as Uint8Array[];
  
  const nonce = rlpToBigInt(nonceBuf);
  const gasPrice = rlpToBigInt(gasPriceBuf);
  const gasLimit = rlpToBigInt(gasLimitBuf);
  const to = toBuf.length === 20 ? rlpToHex(toBuf) : '(合约创建)';
  const value = rlpToBigInt(valueBuf);
  const data = rlpToHex(dataBuf);
  const v = rlpToBigInt(vBuf);
  const r = rlpToHex(rBuf);
  const s = rlpToHex(sBuf);
  
  L.push(`Nonce: ${nonce}`);
  L.push(`Gas Price: ${gasPrice} wei (${Number(gasPrice) / 1e9} gwei)`);
  L.push(`Gas Limit: ${gasLimit}`);
  L.push(`To: ${to}`);
  L.push(`Value: ${value} wei (${Number(value) / 1e18} ETH)`);
  L.push('');
  L.push('── 签名参数 ──');
  L.push(`v: ${v}`);
  L.push(`r: ${r}`);
  L.push(`s: ${s}`);
  L.push('');
  L.push(`── 数据 (${dataBuf.length} 字节) ──`);
  L.push(`  ${data.length > 200 ? data.substring(0, 200) + '...' : data}`);
  L.push('');
  
  L.push(`总大小: ${consumed} 字节`);
  return L.join('\\n');
}

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 10) {
    throw new Error('数据过短，无法解析交易');
  }
  
  if (bytes[0] >= 0xc0) {
    try {
      return parseEthereumTx(bytes);
    } catch (e) {
      throw new Error(`解析 Ethereum 交易失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  } else {
    try {
      return parseBitcoinTx(bytes);
    } catch (e) {
      throw new Error(`解析 Bitcoin 交易失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  }
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="区块链交易解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 1024 * 1024);
        const noteIdx = hex.indexOf('\\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
