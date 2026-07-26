import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- HID keycode to character mapping ---------- */

// USB HID Usage Tables - Keyboard/Keypad Page (0x07)
// Index 0 = no shift, Index 1 = shift
const HID_MAP: Record<number, [string, string]> = {
  0x04: ['a', 'A'], 0x05: ['b', 'B'], 0x06: ['c', 'C'], 0x07: ['d', 'D'],
  0x08: ['e', 'E'], 0x09: ['f', 'F'], 0x0a: ['g', 'G'], 0x0b: ['h', 'H'],
  0x0c: ['i', 'I'], 0x0d: ['j', 'J'], 0x0e: ['k', 'K'], 0x0f: ['l', 'L'],
  0x10: ['m', 'M'], 0x11: ['n', 'N'], 0x12: ['o', 'O'], 0x13: ['p', 'P'],
  0x14: ['q', 'Q'], 0x15: ['r', 'R'], 0x16: ['s', 'S'], 0x17: ['t', 'T'],
  0x18: ['u', 'U'], 0x19: ['v', 'V'], 0x1a: ['w', 'W'], 0x1b: ['x', 'X'],
  0x1c: ['y', 'Y'], 0x1d: ['z', 'Z'],
  0x1e: ['1', '!'], 0x1f: ['2', '@'], 0x20: ['3', '#'], 0x21: ['4', '$'],
  0x22: ['5', '%'], 0x23: ['6', '^'], 0x24: ['7', '&'], 0x25: ['8', '*'],
  0x26: ['9', '('], 0x27: ['0', ')'],
  0x28: ['\n', '\n'], 0x29: ['[ESC]', '[ESC]'], 0x2a: ['[BACKSPACE]', '[BACKSPACE]'],
  0x2b: ['\t', '\t'], 0x2c: [' ', ' '],
  0x2d: ['-', '_'], 0x2e: ['=', '+'], 0x2f: ['[', '{'], 0x30: [']', '}'],
  0x31: ['\\', '|'], 0x33: [';', ':'], 0x34: ["'", '"'], 0x35: ['`', '~'],
  0x36: [',', '<'], 0x37: ['.', '>'], 0x38: ['/', '?'],
  0x39: ['[CAPSLOCK]', '[CAPSLOCK]'],
  0x3a: ['[F1]', '[F1]'], 0x3b: ['[F2]', '[F2]'], 0x3c: ['[F3]', '[F3]'],
  0x3d: ['[F4]', '[F4]'], 0x3e: ['[F5]', '[F5]'], 0x3f: ['[F6]', '[F6]'],
  0x40: ['[F7]', '[F7]'], 0x41: ['[F8]', '[F8]'], 0x42: ['[F9]', '[F9]'],
  0x43: ['[F10]', '[F10]'], 0x44: ['[F11]', '[F11]'], 0x45: ['[F12]', '[F12]'],
  0x46: ['[PRINTSCREEN]', '[PRINTSCREEN]'], 0x47: ['[SCROLLLOCK]', '[SCROLLLOCK]'],
  0x48: ['[PAUSE]', '[PAUSE]'], 0x49: ['[INSERT]', '[INSERT]'],
  0x4a: ['[HOME]', '[HOME]'], 0x4b: ['[PAGEUP]', '[PAGEUP]'],
  0x4c: ['[DELETE]', '[DELETE]'], 0x4d: ['[END]', '[END]'],
  0x4e: ['[PAGEDOWN]', '[PAGEDOWN]'], 0x4f: ['[RIGHT]', '[RIGHT]'],
  0x50: ['[LEFT]', '[LEFT]'], 0x51: ['[DOWN]', '[DOWN]'], 0x52: ['[UP]', '[UP]'],
};

// Modifier bits
const MOD_CTRL = 0x01;
const MOD_SHIFT = 0x02;
const MOD_ALT = 0x04;
const MOD_WIN = 0x08;

interface KeyReport {
  modifier: number;
  keys: number[];
}

interface DecodedKey {
  char: string;
  modifier: number;
  keycode: number;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  win: boolean;
}

/* ---------- Parse USB HID reports ---------- */

function parseReports(bytes: Uint8Array): KeyReport[] {
  const reports: KeyReport[] = [];
  const reportSize = 8;
  for (let i = 0; i + reportSize <= bytes.length; i += reportSize) {
    const modifier = bytes[i];
    // bytes[i+1] is reserved
    const keys: number[] = [];
    for (let j = 2; j < reportSize; j++) {
      if (bytes[i + j] !== 0) keys.push(bytes[i + j]);
    }
    if (modifier !== 0 || keys.length > 0) {
      reports.push({ modifier, keys });
    }
  }
  return reports;
}

function decodeReports(reports: KeyReport[]): DecodedKey[] {
  const decoded: DecodedKey[] = [];
  let prevKeys: Set<number> = new Set();

  for (const report of reports) {
    const currentKeys = new Set(report.keys);
    const ctrl = (report.modifier & MOD_CTRL) !== 0;
    const shift = (report.modifier & MOD_SHIFT) !== 0;
    const alt = (report.modifier & MOD_ALT) !== 0;
    const win = (report.modifier & MOD_WIN) !== 0;

    // Only decode newly pressed keys (not held from previous report)
    for (const keycode of report.keys) {
      if (!prevKeys.has(keycode)) {
        const mapping = HID_MAP[keycode];
        let char: string;
        if (mapping) {
          char = shift ? mapping[1] : mapping[0];
        } else {
          char = `[0x${keycode.toString(16).toUpperCase().padStart(2, '0')}]`;
        }
        decoded.push({
          char,
          modifier: report.modifier,
          keycode,
          ctrl,
          shift,
          alt,
          win,
        });
      }
    }
    prevKeys = currentKeys;
  }
  return decoded;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 8) throw new Error('数据过短，至少需要 8 字节（1 个 HID 报告）');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  USB 键盘数据恢复报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const reports = parseReports(bytes);
  L.push(`数据大小: ${bytes.length} 字节`);
  L.push(`HID 报告数: ${Math.floor(bytes.length / 8)} (其中 ${reports.length} 个含按键)`);
  L.push('');

  const decoded = decodeReports(reports);

  L.push('── 按键序列 ──');
  decoded.forEach((k: DecodedKey, i: number) => {
    const mods: string[] = [];
    if (k.ctrl) mods.push('Ctrl');
    if (k.shift) mods.push('Shift');
    if (k.alt) mods.push('Alt');
    if (k.win) mods.push('Win');
    const modStr = mods.length > 0 ? mods.join('+') + '+' : '';
    L.push(`[${i + 1}] ${modStr}${k.char}  (keycode=0x${k.keycode.toString(16).toUpperCase().padStart(2, '0')})`);
  });
  L.push('');

  // Reconstruct text - apply backspace
  L.push('── 重建文本 ──');
  let text = '';
  for (const k of decoded) {
    if (k.ctrl || k.alt || k.win) {
      // Skip control combos for text reconstruction
      continue;
    }
    if (k.char === '[BACKSPACE]') {
      text = text.slice(0, -1);
    } else if (k.char === '[CAPSLOCK]' || k.char.startsWith('[F') ||
               k.char.startsWith('[') && k.char.endsWith(']')) {
      // Skip special keys
      continue;
    } else {
      text += k.char;
    }
  }
  L.push(text || '(空)');
  L.push('');

  L.push('── 备注 ──');
  L.push('  报告格式: [modifier, reserved, key1..key6] (8 字节)');
  L.push('  Modifier: bit0=Ctrl, bit1=Shift, bit2=Alt, bit4=Win');
  L.push('  仅记录新按下的键，忽略持续按住的键');
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="USB键盘数据恢复"
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
