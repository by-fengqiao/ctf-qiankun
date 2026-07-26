export interface CodecParam {
  label: string;
  default: string;
  placeholder: string;
}

export interface Codec {
  name: string;
  encode: (input: string, param?: string) => string;
  decode: (input: string, param?: string) => string;
  test: (input: string) => boolean;
  param?: CodecParam;
  decodeOnly?: boolean;
}

export interface EncodeLayer {
  codecName: string;
  param: string;
}

export interface DecodeCandidate {
  type: string;
  result: string;
  confidence: number;
  description: string;
  steps: string[];
  isBruteForce?: boolean;
  bruteForceParam?: string;
}

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder('utf-8', { fatal: false }).decode(bytes);

export function tryDecode(fn: () => string): { result: string; error: boolean } {
  try {
    return { result: fn(), error: false };
  } catch {
    return { result: '', error: true };
  }
}

const MORSE_TABLE: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
  '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
  '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
  '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
  '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
  '---..': '8', '----.': '9',
};

const MORSE_REVERSE: Record<string, string> = Object.entries(MORSE_TABLE).reduce(
  (acc, [k, v]) => { acc[v] = k; return acc; }, {} as Record<string, string>
);

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE92_ALPHABET = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const BASE45_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function decodeBase64(input: string): string {
  const clean = input.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytesToStr(bytes);
}

function encodeBase64(input: string): string {
  const bytes = strToBytes(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64URL(input: string): string {
  const std = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = std + '='.repeat((4 - (std.length % 4)) % 4);
  return decodeBase64(padded);
}

function encodeBase64URL(input: string): string {
  return encodeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeHex(input: string): string {
  const clean = input.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return bytesToStr(bytes);
}

function encodeHex(input: string): string {
  const bytes = strToBytes(input);
  return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
}

function decodeURLEncoded(input: string): string {
  return decodeURIComponent(input);
}

function encodeURLEncoded(input: string): string {
  return encodeURIComponent(input);
}

function decodeUnicodeEscape(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function encodeUnicodeEscape(input: string): string {
  let result = '';
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code > 127) result += `\\u${code.toString(16).padStart(4, '0')}`;
    else result += char;
  }
  return result;
}

function decodeJWT(input: string): string {
  const parts = input.split('.');
  if (parts.length < 2) throw new Error('Not a JWT');
  const header = JSON.parse(decodeBase64URL(parts[0]));
  const payload = JSON.parse(decodeBase64URL(parts[1]));
  return JSON.stringify({ header, payload }, null, 2);
}

function decodeBase32(input: string): string {
  const clean = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid Base32 char: ' + char);
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return bytesToStr(new Uint8Array(bytes));
}

function encodeBase32(input: string): string {
  const bytes = strToBytes(input);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  const pad = (8 - (result.length % 8)) % 8;
  return result + '='.repeat(pad);
}

function decodeBinary(input: string): string {
  const clean = input.replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= clean.length; i += 8) bytes.push(parseInt(clean.slice(i, i + 8), 2));
  return bytesToStr(new Uint8Array(bytes));
}

function encodeBinary(input: string): string {
  const bytes = strToBytes(input);
  return Array.from(bytes).map((b: number) => b.toString(2).padStart(8, '0')).join(' ');
}

function decodeOctal(input: string): string {
  const tokens = input.trim().split(/\s+/);
  const bytes: number[] = [];
  for (const token of tokens) {
    const code = parseInt(token, 8);
    if (Number.isNaN(code)) throw new Error('Invalid octal: ' + token);
    bytes.push(code);
  }
  return bytesToStr(new Uint8Array(bytes));
}

function encodeOctal(input: string): string {
  const bytes = strToBytes(input);
  return Array.from(bytes).map((b: number) => b.toString(8).padStart(3, '0')).join(' ');
}

function decodeMorse(input: string): string {
  const tokens = input.trim().split(/\s+/);
  let result = '';
  for (const token of tokens) {
    if (token === '/' || token === '|') { result += ' '; continue; }
    const char = MORSE_TABLE[token];
    if (!char) throw new Error('Unknown morse: ' + token);
    result += char;
  }
  return result;
}

function encodeMorse(input: string): string {
  const upper = input.toUpperCase();
  const tokens: string[] = [];
  for (const char of upper) {
    if (char === ' ') { tokens.push('/'); continue; }
    const morse = MORSE_REVERSE[char];
    if (!morse) tokens.push(char);
    else tokens.push(morse);
  }
  return tokens.join(' ');
}

function decodeROT13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

const encodeROT13 = decodeROT13;

function decodeHTMLEntity(input: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = input;
  return el.value;
}

function encodeHTMLEntity(input: string): string {
  return input.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return entities[char] ?? char;
  });
}

function caesarDecode(input: string, shift: string): string {
  const s = parseInt(shift, 10) || 0;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base - s % 26 + 26) % 26) + base);
  });
}

function caesarEncode(input: string, shift: string): string {
  const s = parseInt(shift, 10) || 0;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + s) % 26) + base);
  });
}

function xorDecode(input: string, key: string): string {
  const keyBytes = strToBytes(key || '\x00');
  if (keyBytes.length === 0) return input;
  const inputBytes = strToBytes(input);
  const out = new Uint8Array(inputBytes.length);
  for (let i = 0; i < inputBytes.length; i++) {
    out[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return bytesToStr(out);
}

const xorEncode = xorDecode;

function vigenereDecode(input: string, key: string): string {
  const cleanKey = (key || 'a').toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanKey) return input;
  let ki = 0;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 97;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

function vigenereEncode(input: string, key: string): string {
  const cleanKey = (key || 'a').toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanKey) return input;
  let ki = 0;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 97;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

function atbash(input: string): string {
  let r = '';
  for (const c of input) {
    if (c >= 'A' && c <= 'Z') r += String.fromCharCode(90 - (c.charCodeAt(0) - 65));
    else if (c >= 'a' && c <= 'z') r += String.fromCharCode(122 - (c.charCodeAt(0) - 97));
    else r += c;
  }
  return r;
}

function rot47(input: string): string {
  let r = '';
  for (const c of input) {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) r += String.fromCharCode(33 + (code - 33 + 47) % 94);
    else r += c;
  }
  return r;
}

function rot5(input: string): string {
  return input.replace(/[0-9]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 48 + 5) % 10 + 48));
}

function reverseStr(input: string): string {
  return Array.from(input).reverse().join('');
}

function decodeDecimal(input: string): string {
  const tokens = input.trim().split(/[\s,]+/);
  const bytes = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    const n = parseInt(tokens[i], 10);
    if (Number.isNaN(n) || n < 0 || n > 255) throw new Error('Invalid decimal: ' + tokens[i]);
    bytes[i] = n;
  }
  return bytesToStr(bytes);
}

function encodeDecimal(input: string): string {
  const bytes = strToBytes(input);
  return Array.from(bytes).join(' ');
}

function bigIntBaseDecode(input: string, alphabet: string): Uint8Array {
  const clean = input.replace(/\s/g, '');
  let leadingZeros = 0;
  for (const c of clean) {
    if (c === alphabet[0]) leadingZeros++;
    else break;
  }
  let num = 0n;
  const base = BigInt(alphabet.length);
  for (const c of clean) {
    const idx = alphabet.indexOf(c);
    if (idx === -1) throw new Error(`Invalid char: ${c}`);
    num = num * base + BigInt(idx);
  }
  const bytes: number[] = [];
  while (num > 0n) { bytes.unshift(Number(num & 0xffn)); num >>= 8n; }
  for (let i = 0; i < leadingZeros; i++) bytes.unshift(0);
  return new Uint8Array(bytes);
}

function bigIntBaseEncode(input: string, alphabet: string): string {
  const bytes = strToBytes(input);
  let leadingZeros = 0;
  for (const b of bytes) { if (b === 0) leadingZeros++; else break; }
  let num = 0n;
  for (const b of bytes) num = (num << 8n) | BigInt(b);
  if (num === 0n) return alphabet[0].repeat(Math.max(leadingZeros, 1));
  let result = '';
  const base = BigInt(alphabet.length);
  while (num > 0n) { result = alphabet[Number(num % base)] + result; num /= base; }
  return alphabet[0].repeat(leadingZeros) + result;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase2048(input: string): string {
  if (input.length === 0) return '';
  const OFFSET = 0x4e00, BITS = 11;
  const paddingBits = input.charCodeAt(0) - 48;
  if (paddingBits < 0 || paddingBits > 10) throw new Error('Invalid length marker');
  const body = input.slice(1);
  let bits = 0, value = 0n, numChars = 0;
  const out: number[] = [];
  for (const ch of body) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp < OFFSET || cp >= OFFSET + 2048) continue;
    value = (value << BigInt(BITS)) | BigInt(cp - OFFSET);
    bits += BITS; numChars++;
    while (bits >= 8) { out.push(Number((value >> BigInt(bits - 8)) & 0xffn)); bits -= 8; }
  }
  const realBytes = (numChars * BITS - paddingBits) / 8;
  return bytesToStr(new Uint8Array(out.slice(0, realBytes)));
}

function encodeBase2048(input: string): string {
  const bytes = strToBytes(input);
  if (bytes.length === 0) return '';
  const OFFSET = 0x4e00, BITS = 11;
  let bits = 0, value = 0n, result = '';
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
    bits += 8;
    while (bits >= BITS) {
      result += String.fromCodePoint(OFFSET + Number((value >> BigInt(bits - BITS)) & 0x7ffn));
      bits -= BITS;
    }
  }
  let paddingBits = 0;
  if (bits > 0) {
    paddingBits = BITS - bits;
    result += String.fromCodePoint(OFFSET + Number((value << BigInt(paddingBits)) & 0x7ffn));
  }
  return String.fromCharCode(48 + paddingBits) + result;
}

function decodeBase65536(input: string): string {
  if (input.length === 0) return '';
  const odd = input[0] === '1';
  const body = input.slice(1);
  const bytes: number[] = [];
  for (const ch of Array.from(body)) {
    const code = ch.charCodeAt(0) - 0x4e00;
    if (code < 0 || code > 0xffff) { bytes.push(0x3f); continue; }
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  if (odd && bytes.length > 0) bytes.pop();
  return bytesToStr(new Uint8Array(bytes));
}

function encodeBase65536(input: string): string {
  const bytes = strToBytes(input);
  if (bytes.length === 0) return '';
  const odd = bytes.length % 2;
  let result = odd ? '1' : '0';
  for (let i = 0; i < bytes.length; i += 2) {
    const hi = bytes[i];
    const lo = i + 1 < bytes.length ? bytes[i + 1] : 0;
    result += String.fromCharCode(0x4e00 + ((hi << 8) | lo));
  }
  return result;
}

function decodeBase85(input: string): string {
  let clean = input.trim();
  if (clean.startsWith('<~')) clean = clean.slice(2);
  if (clean.endsWith('~>')) clean = clean.slice(0, -2);
  clean = clean.replace(/\s/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 5) {
    const chunk = clean.slice(i, i + 5);
    const chars = chunk.split('');
    while (chars.length < 5) chars.push('u');
    let val = 0;
    for (const c of chars) {
      const code = c.charCodeAt(0) - 33;
      if (code < 0 || code > 84) throw new Error(`Invalid char: ${c}`);
      val = val * 85 + code;
    }
    const padding = 5 - chunk.length;
    out.push((val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
    for (let p = 0; p < padding; p++) out.pop();
  }
  return bytesToStr(new Uint8Array(out));
}

function encodeBase85(input: string): string {
  const bytes = strToBytes(input);
  let result = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const remaining = bytes.length - i;
    const chunk = new Uint8Array(4);
    chunk.set(bytes.subarray(i, i + 4));
    let val = ((chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3]) >>> 0;
    const chars: string[] = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(String.fromCharCode(val % 85 + 33));
      val = Math.floor(val / 85);
    }
    result += chars.slice(0, remaining + 1).join('');
  }
  return `<~${result}~>`;
}

const Z85_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

function decodeZ85(input: string): string {
  const clean = input.replace(/\s/g, '');
  if (clean.length === 0) return '';
  const remainder = Z85_ALPHABET.indexOf(clean[0]);
  if (remainder === -1) throw new Error('Invalid length marker');
  const body = clean.slice(1);
  const out: number[] = [];
  for (let i = 0; i < body.length; i += 5) {
    let val = 0;
    const chunk = body.slice(i, i + 5);
    for (const c of chunk) {
      const idx = Z85_ALPHABET.indexOf(c);
      if (idx === -1) throw new Error(`Invalid char: ${c}`);
      val = val * 85 + idx;
    }
    out.push((val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
  }
  const trimCount = remainder ? 4 - remainder : 0;
  return bytesToStr(new Uint8Array(out.slice(0, out.length - trimCount)));
}

function encodeZ85(input: string): string {
  const bytes = strToBytes(input);
  const remainder = bytes.length % 4;
  const padded = new Uint8Array(bytes.length + (remainder ? 4 - remainder : 0));
  padded.set(bytes);
  let result = Z85_ALPHABET[remainder];
  for (let i = 0; i < padded.length; i += 4) {
    let val = ((padded[i] << 24) | (padded[i + 1] << 16) | (padded[i + 2] << 8) | padded[i + 3]) >>> 0;
    const chars: string[] = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(Z85_ALPHABET[val % 85]);
      val = Math.floor(val / 85);
    }
    result += chars.join('');
  }
  return result;
}

export const CODECS: Codec[] = [
  { name: 'Base64', encode: encodeBase64, decode: decodeBase64,
    test: (s) => /^[A-Za-z0-9+/]+={0,2}$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length % 4 === 0 },
  { name: 'Base64URL', encode: encodeBase64URL, decode: decodeBase64URL,
    test: (s) => /^[A-Za-z0-9_-]+={0,2}$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length % 4 === 0 && /[_-]/.test(s) },
  { name: 'Hex', encode: encodeHex, decode: decodeHex,
    test: (s) => /^[0-9a-fA-F]+$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length % 2 === 0 },
  { name: 'Base16', encode: (s) => encodeHex(s).toUpperCase(), decode: decodeHex,
    test: (s) => /^[0-9A-F]+$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length % 2 === 0 },
  { name: 'URL', encode: encodeURLEncoded, decode: decodeURLEncoded,
    test: (s) => /%[0-9a-fA-F]{2}/.test(s) },
  { name: 'Unicode Escape', encode: encodeUnicodeEscape, decode: decodeUnicodeEscape,
    test: (s) => /\\u[0-9a-fA-F]{4}/.test(s) },
  { name: 'JWT', encode: () => { throw new Error('JWT encode not supported'); }, decode: decodeJWT,
    test: (s) => s.split('.').length === 3 && s.split('.').every((p) => p.length > 0), decodeOnly: true },
  { name: 'Base32', encode: encodeBase32, decode: decodeBase32,
    test: (s) => /^[A-Z2-7]+=*$/.test(s.replace(/\s/g, '')) },
  { name: 'Binary', encode: encodeBinary, decode: decodeBinary,
    test: (s) => /^[01\s]+$/.test(s) && s.replace(/\s/g, '').length % 8 === 0 },
  { name: 'Octal', encode: encodeOctal, decode: decodeOctal,
    test: (s) => /^[0-7\s]+$/.test(s) && /\s/.test(s) },
  { name: 'Decimal', encode: encodeDecimal, decode: decodeDecimal,
    test: (s) => /^[\d\s,]+$/.test(s) && /\d/.test(s) && /\s/.test(s) },
  { name: 'Morse', encode: encodeMorse, decode: decodeMorse,
    test: (s) => /^[.\-/|/\s]+$/.test(s) && /[.\-]/.test(s) },
  { name: 'ROT13', encode: encodeROT13, decode: decodeROT13,
    test: (s) => /^[a-zA-Z\s]+$/.test(s) && /[a-zA-Z]/.test(s) && s.length > 3 },
  { name: 'HTML Entity', encode: encodeHTMLEntity, decode: decodeHTMLEntity,
    test: (s) => /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(s) },
  { name: 'Caesar', encode: caesarEncode, decode: caesarDecode,
    test: (s) => /[a-zA-Z]/.test(s),
    param: { label: 'Shift', default: '3', placeholder: '3' } },
  { name: 'XOR', encode: xorEncode, decode: xorDecode,
    test: () => false,
    param: { label: 'Key', default: '0x00', placeholder: '0x42' } },
  { name: "Vigenère", encode: vigenereEncode, decode: vigenereDecode,
    test: (s) => /[a-zA-Z]/.test(s),
    param: { label: 'Key', default: 'key', placeholder: 'secret' } },
  { name: 'Atbash', encode: atbash, decode: atbash, test: (s) => /[a-zA-Z]/.test(s) },
  { name: 'ROT47', encode: rot47, decode: rot47, test: (s) => /[\x21-\x7e]/.test(s) },
  { name: 'ROT5', encode: rot5, decode: rot5, test: (s) => /[0-9]/.test(s) },
  { name: 'Reverse', encode: reverseStr, decode: reverseStr, test: () => false },
  { name: 'Base36', encode: (s) => bigIntBaseEncode(s, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), decode: (s) => bytesToStr(bigIntBaseDecode(s, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')),
    test: (s) => /^[0-9A-Za-z]+$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length > 2 },
  { name: 'Base45', encode: (s) => bigIntBaseEncode(s, BASE45_ALPHABET),
    decode: (s) => bytesToStr(bigIntBaseDecode(s, BASE45_ALPHABET)),
    test: (s) => new RegExp(`^[${BASE45_ALPHABET.replace(/[$%*+-./:]/g, '\\$&')}]+$`).test(s.replace(/\s/g, '')) },
  { name: 'Base58', encode: (s) => bigIntBaseEncode(s, BASE58_ALPHABET),
    decode: (s) => bytesToStr(bigIntBaseDecode(s, BASE58_ALPHABET)),
    test: (s) => /^[1-9A-HJ-NP-Za-km-z]+$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length > 3 },
  { name: 'Base62', encode: (s) => bigIntBaseEncode(s, BASE62_ALPHABET),
    decode: (s) => bytesToStr(bigIntBaseDecode(s, BASE62_ALPHABET)),
    test: (s) => /^[0-9A-Za-z]+$/.test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length > 3 },
  { name: 'Base85', encode: encodeBase85, decode: decodeBase85,
    test: (s) => /<~[^>]*~>/.test(s) || /^[!-u]+$/.test(s.replace(/\s/g, '')) },
  { name: 'Base92', encode: (s) => bigIntBaseEncode(s, BASE92_ALPHABET),
    decode: (s) => bytesToStr(bigIntBaseDecode(s, BASE92_ALPHABET)),
    test: (s) => new RegExp(`^[${BASE92_ALPHABET.replace(/["'\\]/g, '\\$&')}]+$`).test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length > 2 },
  { name: 'Z85', encode: encodeZ85, decode: decodeZ85,
    test: (s) => new RegExp(`^[${Z85_ALPHABET.replace(/[$%*+-./:?^!&<>(){}@#]/g, '\\$&')}]+$`).test(s.replace(/\s/g, '')) && s.replace(/\s/g, '').length > 4 },
  { name: 'Base2048', encode: encodeBase2048, decode: decodeBase2048,
    test: (s) => /^[\x30-\x39\u4e00-\u56ff]+$/.test(s) && s.length > 1 },
  { name: 'Base65536', encode: encodeBase65536, decode: decodeBase65536,
    test: (s) => /^[01][\u4e00-\u9fff]+$/.test(s) },
];

export const CODEC_MAP: Record<string, Codec> = Object.fromEntries(CODECS.map((c) => [c.name, c]));

export const ENCODE_ONLY_CODECS = CODECS.filter((c) => !c.decodeOnly);
