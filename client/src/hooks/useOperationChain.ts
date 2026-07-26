import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/safe-logger';

export interface ChainStep {
  id: string;
  toolId: string;
  toolName: string;
  input: string;
  output: string;
}

export interface Recipe {
  id: string;
  name: string;
  steps: { toolId: string; toolName: string }[];
  createdAt: number;
}

export interface OperationDef {
  id: string;
  name: string;
  category: 'decode' | 'encode' | 'transform';
  execute: (input: string) => string;
}

interface PresetChain {
  name: string;
  steps: { toolId: string; toolName: string }[];
}

const RECIPE_KEY = 'ctf_chain_recipes';
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function decodeBase64(input: string): string {
  const clean = input.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytesToText(bytes);
}

function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeHex(input: string): string {
  const clean = input.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return bytesToText(bytes);
}

function encodeHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
}

function decodeBase32(input: string): string {
  const clean = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid Base32 char');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return bytesToText(new Uint8Array(bytes));
}

function encodeBase32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) result += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  while (result.length % 8 !== 0) result += '=';
  return result;
}

function decodeBinary(input: string): string {
  const clean = input.replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= clean.length; i += 8) bytes.push(parseInt(clean.slice(i, i + 8), 2));
  return bytesToText(new Uint8Array(bytes));
}

function encodeBinary(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return Array.from(bytes).map((b: number) => b.toString(2).padStart(8, '0')).join(' ');
}

function decodeROT13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function decodeBase58(input: string): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const clean = input.trim();
  let zeros = 0;
  while (zeros < clean.length && clean[zeros] === '1') zeros++;
  let num = 0n;
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) throw new Error('Invalid Base58 char: ' + c);
    num = num * 58n + BigInt(idx);
  }
  const hex = num === 0n ? '' : num.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) bytes.push(parseInt(padded.slice(i, i + 2), 16));
  return '\x00'.repeat(zeros) + bytesToText(new Uint8Array(bytes));
}

function encodeBase58(input: string): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = new TextEncoder().encode(input);
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let result = '';
  while (num > 0n) { result = ALPHABET[Number(num % 58n)] + result; num = num / 58n; }
  return '1'.repeat(zeros) + result;
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
  return input.replace(/[0-9]/g, c => String.fromCharCode((c.charCodeAt(0) - 48 + 5) % 10 + 48));
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

function caesarShift3(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 3) % 26) + base);
  });
}

function caesarUnshift3(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 23) % 26) + base);
  });
}

function decodeHtmlEntity(input: string): string {
  return new DOMParser().parseFromString(input, 'text/html').body.textContent ?? '';
}

function decodeJWT(input: string): string {
  const parts = input.trim().split('.');
  if (parts.length < 2) throw new Error('不是有效的 JWT（需要至少 2 段）');
  const b64url = (s: string) => { const std = s.replace(/-/g, '+').replace(/_/g, '/'); return atob(std + '='.repeat((4 - std.length % 4) % 4)); };
  const header = JSON.parse(b64url(parts[0]));
  const payload = JSON.parse(b64url(parts[1]));
  return JSON.stringify({ header, payload }, null, 2);
}

const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};
const MORSE_REV: Record<string, string> = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

function morseEncode(input: string): string {
  return input.toUpperCase().split('').map(c => c === ' ' ? '/' : (MORSE_TABLE[c] ?? '')).join(' ');
}

function morseDecode(input: string): string {
  return input.trim().split(/\s+/).map(t => t === '/' ? ' ' : (MORSE_REV[t] ?? '')).join('');
}

function xorSingleByte(input: string): string {
  const KEY = 0x42;
  let bytes: Uint8Array;
  const clean = input.replace(/\s/g, '');
  if (/^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) {
    bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  } else {
    bytes = new TextEncoder().encode(input);
  }
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) result[i] = bytes[i] ^ KEY;
  return bytesToText(result);
}

function reverseBytes(input: string): string {
  const clean = input.replace(/\s/g, '');
  if (/^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) {
    const bytes: string[] = [];
    for (let i = 0; i < clean.length; i += 2) bytes.push(clean.slice(i, i + 2));
    return bytes.reverse().join('');
  }
  return [...input].reverse().join('');
}

function decodeAscii85(input: string): string {
  const clean = input.replace(/^<~/, '').replace(/~>$/, '').replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 5) {
    const group = clean.slice(i, i + 5);
    if (group[0] === 'z') { bytes.push(0, 0, 0, 0); continue; }
    let val = 0;
    for (const c of group) val = val * 85 + (c.charCodeAt(0) - 33);
    bytes.push((val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff);
  }
  const padding = (5 - (clean.length % 5)) % 5;
  return bytesToText(new Uint8Array(bytes.slice(0, bytes.length - padding)));
}

function encodeAscii85(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let out = '<~';
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = [0, 0, 0, 0];
    const count = Math.min(4, bytes.length - i);
    for (let j = 0; j < count; j++) chunk[j] = bytes[i + j];
    const val = ((chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3]) >>> 0;
    if (val === 0 && count === 4) { out += 'z'; continue; }
    const chars: string[] = [];
    let v = val;
    for (let j = 0; j < 5; j++) { chars.unshift(String.fromCharCode((v % 85) + 33)); v = Math.floor(v / 85); }
    out += chars.slice(0, count + 1).join('');
  }
  return out + '~>';
}

const OPERATIONS: OperationDef[] = [
  { id: 'base64-decode', name: 'Base64 解码', category: 'decode', execute: decodeBase64 },
  { id: 'base64-encode', name: 'Base64 编码', category: 'encode', execute: encodeBase64 },
  { id: 'base32-decode', name: 'Base32 解码', category: 'decode', execute: decodeBase32 },
  { id: 'base32-encode', name: 'Base32 编码', category: 'encode', execute: encodeBase32 },
  { id: 'base58-decode', name: 'Base58 解码', category: 'decode', execute: decodeBase58 },
  { id: 'base58-encode', name: 'Base58 编码', category: 'encode', execute: encodeBase58 },
  { id: 'ascii85-decode', name: 'Ascii85 解码', category: 'decode', execute: decodeAscii85 },
  { id: 'ascii85-encode', name: 'Ascii85 编码', category: 'encode', execute: encodeAscii85 },
  { id: 'hex-decode', name: 'Hex 解码', category: 'decode', execute: decodeHex },
  { id: 'hex-encode', name: 'Hex 编码', category: 'encode', execute: encodeHex },
  { id: 'binary-decode', name: '二进制解码', category: 'decode', execute: decodeBinary },
  { id: 'binary-encode', name: '二进制编码', category: 'encode', execute: encodeBinary },
  { id: 'url-decode', name: 'URL 解码', category: 'decode', execute: (s: string) => decodeURIComponent(s) },
  { id: 'url-encode', name: 'URL 编码', category: 'encode', execute: (s: string) => encodeURIComponent(s) },
  { id: 'unicode-unescape', name: 'Unicode 反转义', category: 'decode', execute: (s: string) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16))) },
  { id: 'unicode-escape', name: 'Unicode 转义', category: 'encode', execute: (s: string) => s.replace(/[^\x00-\x7F]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) },
  { id: 'html-entity-decode', name: 'HTML 实体解码', category: 'decode', execute: decodeHtmlEntity },
  { id: 'jwt-decode', name: 'JWT 解码', category: 'decode', execute: decodeJWT },
  { id: 'morse-encode', name: 'Morse 编码', category: 'encode', execute: morseEncode },
  { id: 'morse-decode', name: 'Morse 解码', category: 'decode', execute: morseDecode },
  { id: 'rot13', name: 'ROT13', category: 'transform', execute: decodeROT13 },
  { id: 'rot47', name: 'ROT47', category: 'transform', execute: rot47 },
  { id: 'rot5', name: 'ROT5（数字）', category: 'transform', execute: rot5 },
  { id: 'caesar-enc3', name: 'Caesar +3', category: 'encode', execute: caesarShift3 },
  { id: 'caesar-dec3', name: 'Caesar -3', category: 'decode', execute: caesarUnshift3 },
  { id: 'atbash', name: 'Atbash', category: 'transform', execute: atbash },
  { id: 'xor-0x42', name: 'XOR 0x42', category: 'transform', execute: xorSingleByte },
  { id: 'reverse', name: '反转文本', category: 'transform', execute: (s: string) => [...s].reverse().join('') },
  { id: 'reverse-bytes', name: '反转字节序', category: 'transform', execute: reverseBytes },
  { id: 'uppercase', name: '转大写', category: 'transform', execute: (s: string) => s.toUpperCase() },
  { id: 'lowercase', name: '转小写', category: 'transform', execute: (s: string) => s.toLowerCase() },
];

const PRESET_CHAINS: PresetChain[] = [
  { name: 'Base64 → Hex → URL', steps: [{ toolId: 'base64-decode', toolName: 'Base64 解码' }, { toolId: 'hex-encode', toolName: 'Hex 编码' }, { toolId: 'url-encode', toolName: 'URL 编码' }] },
  { name: 'URL → Base64 → UTF8', steps: [{ toolId: 'url-decode', toolName: 'URL 解码' }, { toolId: 'base64-decode', toolName: 'Base64 解码' }, { toolId: 'unicode-unescape', toolName: 'Unicode 反转义' }] },
  { name: 'Hex → Base64 → ASCII', steps: [{ toolId: 'hex-decode', toolName: 'Hex 解码' }, { toolId: 'base64-decode', toolName: 'Base64 解码' }, { toolId: 'reverse', toolName: '反转文本' }] },
];

export function useOperationChain() {
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECIPE_KEY);
      if (stored) setRecipes(JSON.parse(stored) as Recipe[]);
    } catch (e) {
      logger.error('Failed to load recipes', e);
    }
  }, []);

  const addStep = useCallback((toolId: string, toolName: string) => {
    setSteps((prev) => [...prev, { id: generateId(), toolId, toolName, input: '', output: '' }]);
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s: ChainStep) => s.id !== id));
  }, []);

  const moveStep = useCallback((index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const clearSteps = useCallback(() => setSteps([]), []);

  const executeChain = useCallback((initialInput: string): string => {
    let current = initialInput;
    const updated: ChainStep[] = [];
    let failed = false;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (failed) { updated.push({ ...step, input: '', output: '' }); continue; }
      const op = OPERATIONS.find((o: OperationDef) => o.id === step.toolId);
      let output: string;
      if (!op) { output = '[未知操作]'; failed = true; }
      else {
        try { output = op.execute(current); }
        catch (e) { output = `[错误] ${e instanceof Error ? e.message : '执行失败'}`; failed = true; }
      }
      updated.push({ ...step, input: current, output });
      current = output;
    }
    setSteps(updated);
    return current;
  }, [steps]);

  const saveRecipe = useCallback((name: string) => {
    const recipe: Recipe = { id: generateId(), name, steps: steps.map((s: ChainStep) => ({ toolId: s.toolId, toolName: s.toolName })), createdAt: Date.now() };
    setRecipes((prev) => {
      const next = [...prev, recipe];
      try { localStorage.setItem(RECIPE_KEY, JSON.stringify(next)); } catch (e) { logger.error('Failed to save recipe', e); }
      return next;
    });
  }, [steps]);

  const loadRecipe = useCallback((recipe: { steps: { toolId: string; toolName: string }[] }) => {
    setSteps(recipe.steps.map((s: { toolId: string; toolName: string }) => ({ id: generateId(), toolId: s.toolId, toolName: s.toolName, input: '', output: '' })));
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => {
      const next = prev.filter((r: Recipe) => r.id !== id);
      try { localStorage.setItem(RECIPE_KEY, JSON.stringify(next)); } catch (e) { logger.error('Failed to delete recipe', e); }
      return next;
    });
  }, []);

  return { steps, recipes, operations: OPERATIONS, addStep, removeStep, moveStep, executeChain, saveRecipe, loadRecipe, deleteRecipe, clearSteps, presetChains: PRESET_CHAINS };
}
