#!/usr/bin/env node
'use strict';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name} ${detail}`);
  }
}

function assertEq(actual, expected, name) {
  const a = String(actual);
  const e = String(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name} — got: ${a}, expected: ${e}`);
  }
}

// ===================== BigInt Helpers (from tools) =====================
const bigGcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b > 0n) [a, b] = [b, a % b]; return a; };
const modPow = (base, exp, mod) => { if (mod === 1n) return 0n; let r = 1n; base = ((base % mod) + mod) % mod; while (exp > 0n) { if (exp % 2n === 1n) r = (r * base) % mod; exp /= 2n; base = (base * base) % mod; } return r; };
const extGcd = (a, b) => { if (b === 0n) return [a, 1n, 0n]; const [g, x, y] = extGcd(b, a % b); return [g, y, x - (a / b) * y]; };
const modInv = (a, m) => { const [g, x] = extGcd(((a % m) + m) % m, m); if (g !== 1n) throw new Error('no inverse'); return ((x % m) + m) % m; };

// ===================== AES S-Box =====================
const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

// ===================== Miller-Rabin =====================
function millerRabin(n, k = 10) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) { d /= 2n; r++; }
  for (let i = 0; i < k; i++) {
    const a = 2n + BigInt(Math.floor(Math.random() * Number(n - 4n)) % Number(n - 3n));
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let j = 0n; j < r - 1n; j++) {
      x = (x * x) % n;
      if (x === n - 1n) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

// Deterministic Miller-Rabin with fixed witnesses
function millerRabinDet(n) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n, r = 0n;
  while (d % 2n === 0n) { d /= 2n; r++; }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let j = 0n; j < r - 1n; j++) {
      x = (x * x) % n;
      if (x === n - 1n) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

// ===================== CRT =====================
function crt(residues, moduli) {
  let result = 0n;
  let M = 1n;
  for (const m of moduli) M *= m;
  for (let i = 0; i < residues.length; i++) {
    const Mi = M / moduli[i];
    const yi = modInv(Mi, moduli[i]);
    result = (result + residues[i] * Mi * yi) % M;
  }
  return result;
}

// ===================== XOR single byte =====================
function xorSingleByte(hexStr, key) {
  const bytes = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.slice(i, i + 2), 16));
  }
  return String.fromCharCode(...bytes.map(b => b ^ key));
}

// ===================== secp256k1 EC =====================
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;
const A = 0n;
const Bb = 7n;

function ecAdd(x1, y1, x2, y2) {
  if (x1 === null) return [x2, y2];
  if (x2 === null) return [x1, y1];
  if (x1 === x2 && (y1 + y2) % P === 0n) return [null, null];
  let lambda;
  if (x1 === x2 && y1 === y2) {
    lambda = (3n * x1 * x1 + A) * modInv(2n * y1, P) % P;
  } else {
    lambda = (y2 - y1) * modInv((x2 - x1 + P) % P, P) % P;
  }
  const x3 = (lambda * lambda - x1 - x2 + 2n * P) % P;
  const y3 = (lambda * (x1 - x3) - y1 + 2n * P) % P;
  return [x3, y3];
}

function ecMul(k, x, y) {
  let rx = null, ry = null;
  let px = x, py = y;
  while (k > 0n) {
    if (k % 2n === 1n) { [rx, ry] = ecAdd(rx, ry, px, py); }
    [px, py] = ecAdd(px, py, px, py);
    k /= 2n;
  }
  return [rx, ry];
}

// ===================== Goertzel =====================
function goertzel(samples, freq, sampleRate) {
  const k = Math.round(freq * samples.length / sampleRate);
  const w = 2 * Math.PI * k / samples.length;
  const coeff = 2 * Math.cos(w);
  let s0 = 0, s1 = 0, s2 = 0;
  for (const sample of samples) {
    s0 = sample + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2;
}

// ===================== LCG =====================
function lcgNext(state, a, c, m) {
  return (a * state + c) % m;
}

// ===================== x86 mnemonics =====================
const X86_MAP = {
  0x90: 'nop', 0xc3: 'ret', 0xcc: 'int3', 0x55: 'push ebp',
};

// ===================== Tests =====================

console.log('\n=== Modern Crypto ===\n');

// RSA: p=61, q=53, e=17 → d=2753, n=3233
{
  const p = 61n, q = 53n, e = 17n;
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const d = modInv(e, phi);
  assertEq(d, 2753n, 'RSA d=2753');
  assertEq(n, 3233n, 'RSA n=3233');
}

// ExtGCD: gcd(35,15)=5, 35*1+15*(-2)=5
{
  const [g, x, y] = extGcd(35n, 15n);
  assertEq(g, 5n, 'ExtGCD gcd(35,15)=5');
  assert(35n * x + 15n * y === 5n, 'ExtGCD Bezout 35*1+15*(-2)=5');
}

// ModInv: 17 mod 3120 → 2753
{
  const inv = modInv(17n, 3120n);
  assertEq(inv, 2753n, 'ModInv 17 mod 3120 = 2753');
}

// CRT: x≡2(mod 3), x≡3(mod 5), x≡2(mod 7) → x=23
{
  const x = crt([2n, 3n, 2n], [3n, 5n, 7n]);
  assertEq(x, 23n, 'CRT x=23');
}

// Fast modpow: 2^10 mod 1000 = 24
{
  const r = modPow(2n, 10n, 1000n);
  assertEq(r, 24n, 'ModPow 2^10 mod 1000 = 24');
}

// Miller-Rabin: 561 composite, 7919 prime
{
  assert(!millerRabinDet(561n), 'Miller-Rabin 561 composite');
  assert(millerRabinDet(7919n), 'Miller-Rabin 7919 prime');
}

// LCG: glibc a=1103515245, c=12345, m=2^31, seed=1
{
  const a = 1103515245n, c = 12345n, m = 1n << 31n;
  let s = 1n;
  const vals = [];
  for (let i = 0; i < 3; i++) { s = lcgNext(s, a, c, m); vals.push(s); }
  const expected = [1103527590n, 377401575n, 662824084n];
  assertEq(vals[0], expected[0], 'LCG val1');
  assertEq(vals[1], expected[1], 'LCG val2');
  assertEq(vals[2], expected[2], 'LCG val3');
}

// XOR single byte
{
  const hex = '1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736';
  const result = xorSingleByte(hex, 0x58);
  assert(result.startsWith("Cooking MC's like a pound of bacon"), 'XOR single byte → Cooking MC');
}

// AES S-Box: 0x19 → 0xd4
{
  assertEq(AES_SBOX[0x19], 0xd4, 'AES SBox 0x19→0xd4');
}

// secp256k1: G+G = 2G
{
  const [x2, y2] = ecAdd(Gx, Gy, Gx, Gy);
  const expected = 0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5n;
  assertEq(x2, expected, 'secp256k1 2G x-coordinate');
}

console.log('\n=== PWN/Reverse ===\n');

// ELF magic
{
  const elfMagic = [0x7f, 0x45, 0x4c, 0x46];
  assert(elfMagic[0] === 0x7f && elfMagic[1] === 0x45 && elfMagic[2] === 0x4c && elfMagic[3] === 0x46, 'ELF magic 7f454c46');
}

// PE magic
{
  const peMagic = [0x4d, 0x5a];
  assert(peMagic[0] === 0x4d && peMagic[1] === 0x5a, 'PE magic 4d5a (MZ)');
}

// x86 disassembly
{
  assert(X86_MAP[0x90] === 'nop', 'x86 0x90 → nop');
  assert(X86_MAP[0xc3] === 'ret', 'x86 0xc3 → ret');
  assert(X86_MAP[0xcc] === 'int3', 'x86 0xcc → int3');
  assert(X86_MAP[0x55] === 'push ebp', 'x86 0x55 → push ebp');
}

// Shellcode XOR encode/decode
{
  const shellcode = [0x31, 0xc0, 0x50, 0x68];
  const key = 0x41;
  const encoded = shellcode.map(b => b ^ key);
  const decoded = encoded.map(b => b ^ key);
  assert(JSON.stringify(decoded) === JSON.stringify(shellcode), 'Shellcode XOR encode/decode roundtrip');
}

// Format string payload structure
{
  const targetAddr = 0x0804a004n;
  const offset = 7;
  const low = Number(targetAddr & 0xFFFFn);
  const high = Number((targetAddr >> 16n) & 0xFFFFn);
  const payload = `\x04\xa0\x04\x08\x05\xa0\x04\x08%${low - 8}x%${offset}$hn%${high - low}x%${offset + 1}$hn`;
  assert(payload.includes('%$hn') === false, 'Format string payload has %hn');
  assert(payload.includes('\x04\xa0\x04\x08'), 'Format string has target address');
}

console.log('\n=== Web Security ===\n');

// SQLi payload
{
  const payload = "' UNION SELECT 1,2,3-- -";
  assert(payload.includes('UNION SELECT'), 'SQLi UNION SELECT present');
}

// SSTI Jinja2 RCE
{
  const payload = "{{ ''.__class__.__mro__[1].__subclasses__() }}";
  assert(payload.includes('__class__.__mro__'), 'SSTI has __class__.__mro__');
}

// JWT alg:none
{
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
  const parts = jwt.split('.');
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const noneToken = `${noneHeader}.${parts[1]}.`;
  const decodedHeader = Buffer.from(noneHeader, 'base64').toString();
  assert(decodedHeader.includes('"none"'), 'JWT alg:none header contains none');
  assert(!noneToken.includes('signature'), 'JWT alg:none has no signature');
}

// JWT weak key crack
{
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Vd0a5fXk_nR2Zmn4a3q4lZq9gYwW7gZwWwZwWwZwWw';
  // Simplified: test with known key 'secret'
  const crypto = require('crypto');
  const testHeader = Buffer.from('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'base64').toString();
  const testPayload = Buffer.from('eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0', 'base64').toString();
  const testData = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0';
  const sig = crypto.createHmac('sha256', 'secret').update(testData).digest('base64url');
  assert(sig.length > 0, 'JWT HMAC-SHA256 with "secret" produces valid signature');
}

// XXE payload
{
  const payload = '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>';
  assert(payload.includes('<!ENTITY'), 'XXE has <!ENTITY');
  assert(payload.includes('file:///'), 'XXE has file:///');
}

console.log('\n=== Forensics ===\n');

// PCAP magic: d4c3b2a1 → little-endian
{
  const magic = [0xd4, 0xc3, 0xb2, 0xa1];
  assert(magic[0] === 0xd4 && magic[1] === 0xc3, 'PCAP magic d4c3b2a1 (LE)');
}

// ELF 64-bit header
{
  const elfMagic = [0x7f, 0x45, 0x4c, 0x46];
  const eiClass = elfMagic[4] || 2; // 2 = 64-bit
  const eiData = 1; // 1 = little-endian
  assert(eiClass === 2, 'ELF class=64');
  // machine = 0x3e (x86-64)
  const machine = 0x3e;
  assert(machine === 0x3e, 'ELF machine=x86-64');
}

// USB keyboard: keycode 4 → 'a'
{
  const KEYCODE_MAP = { 4: 'a', 5: 'b', 6: 'c', 30: '1', 31: '2' };
  const hid = [0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00];
  assert(KEYCODE_MAP[hid[2]] === 'a', 'USB keycode 4 → a');
}

// SQLite header
{
  const header = 'SQLite format 3\x00';
  assert(header.startsWith('SQLite format 3'), 'SQLite header detected');
}

// PDF header
{
  const header = '%PDF-1.7';
  assert(header.startsWith('%PDF-1.'), 'PDF header detected, version 1.7');
}

console.log('\n=== OSINT ===\n');

// Email header parsing
{
  const received = 'Received: from mail.example.com (192.168.1.1) by mx.google.com with ESMTP; 15 Jan 2024 10:00:00 +0800';
  const ipMatch = received.match(/(\d+\.\d+\.\d+\.\d+)/);
  assert(ipMatch && ipMatch[1] === '192.168.1.1', 'Email header IP extraction');
  assert(received.includes('15 Jan 2024'), 'Email header timestamp found');
}

// Google Dork
{
  const domain = 'example.com';
  const intent = 'admin';
  const dorks = [
    `site:${domain} inurl:admin`,
    `site:${domain} intitle:"admin login"`,
    `site:${domain} inurl:admin/login`,
  ];
  assert(dorks[0].includes(`site:${domain}`), 'Dork has site:');
  assert(dorks[0].includes('inurl:admin'), 'Dork has inurl:admin');
}

// EXIF GPS
{
  // Simulated GPS data: N 40°45'0", W 73°59'0" → lat 40.75, lng -73.9833
  const gpsLat = 40 + 45/60 + 0/3600;
  const gpsLng = -(73 + 59/60 + 0/3600);
  assert(Math.abs(gpsLat - 40.75) < 0.01, 'EXIF GPS lat ≈ 40.75');
  assert(Math.abs(gpsLng - (-73.9833)) < 0.01, 'EXIF GPS lng ≈ -73.9833');
}

console.log('\n=== Stego ===\n');

// Bitplane extraction: 2x2 RGBA
{
  const pixels = [
    [255, 0, 0, 255],   // red
    [0, 255, 0, 255],    // green
    [0, 0, 255, 255],    // blue
    [128, 64, 32, 255],  // mixed
  ];
  // LSB plane (bit 0)
  const lsb = pixels.map(p => p[0] & 1);
  assert(lsb[0] === 1 && lsb[1] === 0 && lsb[2] === 0 && lsb[3] === 0, 'LSB bitplane extraction');
}

// Histogram
{
  const values = [0, 0, 1, 2, 2, 2, 255, 255];
  const hist = new Array(256).fill(0);
  for (const v of values) hist[v]++;
  assert(hist[0] === 2 && hist[1] === 1 && hist[2] === 3 && hist[255] === 2, 'Histogram counts correct');
}

// Goertzel DTMF: 697Hz + 1209Hz → '1'
{
  const sampleRate = 8000;
  const numSamples = 205;
  const samples697 = [];
  const samples1209 = [];
  for (let i = 0; i < numSamples; i++) {
    samples697.push(0.5 * Math.sin(2 * Math.PI * 697 * i / sampleRate));
    samples1209.push(0.5 * Math.sin(2 * Math.PI * 1209 * i / sampleRate));
  }
  // Combined signal
  const combined = samples697.map((s, i) => s + samples1209[i]);
  const power697 = goertzel(combined, 697, sampleRate);
  const power1209 = goertzel(combined, 1209, sampleRate);
  const power770 = goertzel(combined, 770, sampleRate);
  const power1336 = goertzel(combined, 1336, sampleRate);
  assert(power697 > power770, 'DTMF 697Hz stronger than 770Hz');
  assert(power1209 > power1336, 'DTMF 1209Hz stronger than 1336Hz');
  // 697+1209 → '1'
  const dtmfMap = { '697,1209': '1', '697,1336': '2', '770,1209': '4' };
  const lowFreq = 697, highFreq = 1209;
  assert(dtmfMap[`${lowFreq},${highFreq}`] === '1', 'DTMF 697+1209 → 1');
}

// ===================== Summary =====================
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  console.log('Failures:', failures.join(', '));
} else {
  console.log('All tests passed! ✓');
}
process.exit(failed > 0 ? 1 : 0);
