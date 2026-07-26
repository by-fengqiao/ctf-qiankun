/** Parse a hex string (with optional spaces/0x/colons) into a Uint8Array. */
export function parseHex(input: string): Uint8Array {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s:,-]/g, '').toUpperCase();
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符串长度必须为偶数');
  }
  if (!/^[0-9A-F]*$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

export function readU16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function readU32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

export function readU16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function readU32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

export function bytesToHex(
  bytes: Uint8Array,
  start = 0,
  end = bytes.length,
): string {
  const parts: string[] = [];
  for (let i = start; i < end; i++) {
    parts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  return parts.join(' ');
}

/** Decode a UTF-8 byte array to string. */
export function bytesToText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
}
