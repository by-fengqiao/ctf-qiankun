import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- String extraction ---------- */

const MIN_LEN = 4;
const MAX_STRINGS = 5000;

function extractAscii(data: Uint8Array): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b >= 0x20 && b < 0x7f) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= MIN_LEN) {
        result.push(current);
        if (result.length >= MAX_STRINGS) return result;
      }
      current = '';
    }
  }
  if (current.length >= MIN_LEN) result.push(current);
  return result;
}

function extractUtf16LE(data: Uint8Array): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i + 1 < data.length; i += 2) {
    const lo = data[i];
    const hi = data[i + 1];
    if (hi === 0 && lo >= 0x20 && lo < 0x7f) {
      current += String.fromCharCode(lo);
    } else {
      if (current.length >= MIN_LEN) {
        result.push(current);
        if (result.length >= MAX_STRINGS) return result;
      }
      current = '';
    }
  }
  if (current.length >= MIN_LEN) result.push(current);
  return result;
}

/* ---------- Classifiers ---------- */

interface Classified {
  urls: string[];
  emails: string[];
  ips: string[];
  paths: string[];
  registry: string[];
  passwords: string[];
  flags: string[];
  other: string[];
}

const RE_URL = /https?:\/\/[^\s"'<>\\]+/gi;
const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const RE_IP = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
const RE_PATH = /[A-Za-z]:\\[^\s"'<>|]*/g;
const RE_REG = /(?:HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG|HKLM|HKCU|HKCR|HKU|HKCC)\\[^\s"'<>]*/gi;
const RE_PASS = /(?:password|passwd|pwd|secret|token|api_key|apikey|access_key|credential)\s*[=:]\s*[^\s"'<>]+/gi;
const RE_FLAG = /(?:flag|CTF|ctf|FLAG)\{[^}]*\}/g;

function isValidIP(s: string): boolean {
  const parts = s.split('.');
  if (parts.length !== 4) return false;
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) return false;
  }
  return true;
}

function classify(strings: string[]): Classified {
  const c: Classified = {
    urls: [], emails: [], ips: [], paths: [], registry: [],
    passwords: [], flags: [], other: [],
  };
  const seen = new Set<string>();
  for (const s of strings) {
    let matched = false;
    let m: RegExpExecArray | null;

    RE_FLAG.lastIndex = 0;
    while ((m = RE_FLAG.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.flags.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_URL.lastIndex = 0;
    while ((m = RE_URL.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.urls.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_EMAIL.lastIndex = 0;
    while ((m = RE_EMAIL.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.emails.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_REG.lastIndex = 0;
    while ((m = RE_REG.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.registry.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_PASS.lastIndex = 0;
    while ((m = RE_PASS.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.passwords.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_PATH.lastIndex = 0;
    while ((m = RE_PATH.exec(s)) !== null) {
      if (!seen.has(m[0])) { c.paths.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    RE_IP.lastIndex = 0;
    while ((m = RE_IP.exec(s)) !== null) {
      if (isValidIP(m[0]) && !seen.has(m[0])) { c.ips.push(m[0]); seen.add(m[0]); }
      matched = true;
    }

    if (!matched && s.length >= MIN_LEN) {
      c.other.push(s);
    }
  }
  return c;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  内存镜像字符串提取报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push(`  数据大小: ${bytes.length} 字节`);
  L.push('');

  const ascii = extractAscii(bytes);
  const utf16 = extractUtf16LE(bytes);
  const all = [...ascii, ...utf16];
  L.push(`  ASCII 字符串: ${ascii.length} 条`);
  L.push(`  UTF-16LE 字符串: ${utf16.length} 条`);
  L.push(`  总计: ${all.length} 条`);
  L.push('');

  const c = classify(all);

  const printSection = (title: string, items: string[], limit: number) => {
    L.push(`── ${title} (${items.length} 条) ──`);
    if (items.length === 0) {
      L.push('  无');
    } else {
      const shown = Math.min(limit, items.length);
      for (let i = 0; i < shown; i++) {
        const s = items[i].length > 200 ? items[i].substring(0, 200) + '...' : items[i];
        L.push(`  [${i + 1}] ${s}`);
      }
      if (items.length > limit) {
        L.push(`  ... 还有 ${items.length - limit} 条未显示`);
      }
    }
    L.push('');
  };

  printSection('Flag 模式', c.flags, 50);
  printSection('URL', c.urls, 50);
  printSection('邮箱', c.emails, 50);
  printSection('IP 地址', c.ips, 50);
  printSection('Windows 路径', c.paths, 50);
  printSection('注册表键', c.registry, 50);
  printSection('密码/凭证', c.passwords, 50);
  printSection('其他字符串', c.other, 30);

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="内存镜像字符串提取"
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
