import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ============================================================
 * Shellcode encoder
 * Supports: XOR, alphanumeric, unicode-safe, reverse+NOT
 * Each mode outputs encoded hex + decoder stub assembly
 * ========================================================== */

const hexStr = (b: number): string => b.toString(16).padStart(2, '0');

const parseKey = (keyStr: string): number[] => {
  // Accept hex byte(s) like "90" or "aa,bb,cc" or "aabbcc"
  const cleaned = keyStr.replace(/0x/gi, '').replace(/[\s,-]/g, '');
  if (cleaned === '') return [0x90];
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('密钥必须是有效的hex字节');
  }
  const key: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    key.push(parseInt(cleaned.substring(i, i + 2), 16));
  }
  return key.length === 0 ? [0x90] : key;
};

const randomByte = (): number => Math.floor(Math.random() * 256);

const randomKey = (len: number): number[] => {
  const k: number[] = [];
  for (let i = 0; i < len; i++) k.push(randomByte());
  return k;
};

/* ---------- XOR encoder ---------- */

const xorEncode = (shellcode: Uint8Array, keyParam: string): string => {
  let key = parseKey(keyParam);
  if (keyParam.trim() === '') {
    key = randomKey(1);
  }
  const encoded: number[] = [];
  for (let i = 0; i < shellcode.length; i++) {
    encoded.push(shellcode[i] ^ key[i % key.length]);
  }
  const keyHex = key.map(hexStr).join('');
  const encHex = encoded.map(hexStr).join('');
  const scLen = shellcode.length;

  const stub = [
    '; XOR decoder stub (Linux x86_64)',
    '; 原理: 自定位编码数据, 循环异或还原后跳转执行',
    `; 编码长度: ${scLen} 字节`,
    `; 密钥: ${keyHex}`,
    '',
    'section .text',
    'global _start',
    '_start:',
    '    jmp short call_decoder      ; 跳到 call_decoder',
    '',
    'decoder:',
    '    pop rsi                     ; rsi = encoded shellcode 地址',
    `    mov rcx, ${scLen}            ; rcx = shellcode 长度`,
    `    mov dl, 0x${key.map(hexStr).join('')}  ; XOR 密钥 (取首字节)`,
    '',
    'decode_loop:',
    '    xor byte [rsi], dl           ; 异或还原一字节',
    '    inc rsi                      ; 指针后移',
    '    dec rcx                      ; 计数-1',
    '    jnz decode_loop              ; 循环直到还原完成',
    '',
    '    jmp rsi                      ; 跳入还原后的 shellcode 执行',
    '',
    'call_decoder:',
    '    call decoder                 ; 压入 encoded 地址后跳 decoder',
    '',
    '; --- 编码后的 shellcode (紧跟在 call 之后) ---',
    `; db ${encoded.map((b) => '0x' + hexStr(b)).join(', ')}`,
  ].join('\n');

  return [
    '── XOR 编码结果 ──',
    '',
    `[密钥] 0x${keyHex}`,
    `[长度] ${scLen} 字节`,
    '',
    '[编码 hex]',
    encHex,
    '',
    '── 解码桩 (decoder stub) ──',
    '',
    stub,
  ].join('\n');
};

/* ---------- Alphanumeric encoder ---------- */

const ALPHA_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const toAlphanumeric = (b: number): [number, number] => {
  // split each byte into two 4-bit nibbles, map to alphanumeric
  const high = (b >> 4) & 0x0f;
  const low = b & 0x0f;
  // use 0-9 + a-z to cover 16 values, but pick alpha-safe subset
  const nibbleToAlpha = (n: number): number => {
    const alphaIdx = n % ALPHA_CHARS.length;
    return ALPHA_CHARS.charCodeAt(alphaIdx);
  };
  return [nibbleToAlpha(high), nibbleToAlpha(low)];
};

const alphanumericEncode = (shellcode: Uint8Array): string => {
  const encoded: number[] = [];
  for (let i = 0; i < shellcode.length; i++) {
    const [hi, lo] = toAlphanumeric(shellcode[i]);
    encoded.push(hi, lo);
  }
  const encStr = String.fromCharCode(...encoded);
  const scLen = shellcode.length;

  const stub = [
    '; 字母数字解码桩 (Linux x86_64)',
    '; 原理: 编码数据每字节拆为两个 hex nibble, 映射到字母数字字符',
    ';       解码时将每两个字符还原为一个字节',
    `; 原始长度: ${scLen} 字节, 编码后长度: ${encoded.length} 字节`,
    '',
    'section .text',
    'global _start',
    '_start:',
    '    jmp short call_decoder',
    '',
    'decoder:',
    '    pop rsi                     ; rsi = encoded data 地址',
    `    mov rcx, ${scLen}            ; rcx = 原始字节数`,
    '    mov rdi, rsi                ; rdi = 输出地址 (原地解码)',
    '',
    'decode_loop:',
    '    mov al, [rsi]               ; 取高 nibble 字符',
    '    call char_to_nibble         ; al = 高 nibble (0-15)',
    '    shl al, 4                   ; 左移4位',
    '    mov bl, al                  ; 暂存',
    '    inc rsi',
    '    mov al, [rsi]               ; 取低 nibble 字符',
    '    call char_to_nibble         ; al = 低 nibble',
    '    or al, bl                   ; 合并高低 nibble',
    '    mov [rdi], al               ; 写回解码字节',
    '    inc rsi',
    '    inc rdi',
    '    dec rcx',
    '    jnz decode_loop',
    '',
    '    jmp rsi                     ; 执行解码后的 shellcode',
    '',
    'char_to_nibble:',
    '    ; 输入 al=字符, 输出 al=0-15',
    '    sub al, 0x30                ; ASCII -> value (粗略, 实际需查表)',
    '    cmp al, 9',
    '    jle .done',
    '    sub al, 7                   ; 字母偏移',
    '.done:',
    '    ret',
    '',
    'call_decoder:',
    '    call decoder',
    '',
    `; --- 编码后数据 (${encoded.length} 字节, 全字母数字) ---`,
    `; db "${encStr}"`,
  ].join('\n');

  return [
    '── 字母数字编码结果 ──',
    '',
    `[原始长度] ${scLen} 字节`,
    `[编码长度] ${encoded.length} 字节`,
    `[字符集] [A-Za-z0-9]`,
    '',
    '[编码 hex]',
    bytesToHex(new Uint8Array(encoded)),
    '',
    '[编码文本]',
    encStr,
    '',
    '── 解码桩 (decoder stub) ──',
    '',
    stub,
  ].join('\n');
};

/* ---------- Unicode-safe encoder ---------- */

const unicodeSafeEncode = (shellcode: Uint8Array): string => {
  // Unicode-safe: each byte is expanded to 2 bytes with 0x00 inserted
  // so that no byte forms a multi-byte UTF-8 / UTF-16 invalid sequence.
  // Decoder uses AND to strip null bytes.
  const encoded: number[] = [];
  for (let i = 0; i < shellcode.length; i++) {
    encoded.push(shellcode[i], 0x00);
  }
  const scLen = shellcode.length;

  const stub = [
    '; Unicode-safe 解码桩 (Linux x86_64)',
    '; 原理: 每个原字节后插入 0x00 形成宽字符, 规避 Unicode 过滤',
    ';       解码时 AND 0xFF 还原原字节 (实际需 packed 解码)',
    `; 原始长度: ${scLen} 字节, 编码后长度: ${encoded.length} 字节`,
    '',
    'section .text',
    'global _start',
    '_start:',
    '    jmp short call_decoder',
    '',
    'decoder:',
    '    pop rsi',
    `    mov rcx, ${scLen}`,
    '    mov rdi, rsi',
    '',
    'decode_loop:',
    '    mov al, [rsi]               ; 取原字节',
    '    mov [rdi], al               ; 写回紧凑字节',
    '    add rsi, 2                  ; 跳过 0x00 填充',
    '    inc rdi',
    '    dec rcx',
    '    jnz decode_loop',
    '',
    '    jmp rdi                     ; 执行解码后 shellcode',
    '',
    'call_decoder:',
    '    call decoder',
    '',
    '; --- 编码后数据 (每字节后跟 0x00) ---',
    `; dw ${shellcode.length > 0 ? Array.from(shellcode).map((b) => '0x' + hexStr(b)).join(', ') : ''}`,
  ].join('\n');

  return [
    '── Unicode 安全编码结果 ──',
    '',
    `[原始长度] ${scLen} 字节`,
    `[编码长度] ${encoded.length} 字节 (每字节扩展为 2 字节)`,
    '',
    '[编码 hex]',
    bytesToHex(new Uint8Array(encoded)),
    '',
    '── 解码桩 (decoder stub) ──',
    '',
    stub,
  ].join('\n');
};

/* ---------- Reverse + NOT encoder ---------- */

const reverseNotEncode = (shellcode: Uint8Array): string => {
  // Reverse byte order and bitwise NOT each byte
  const reversed: number[] = [];
  for (let i = shellcode.length - 1; i >= 0; i--) {
    reversed.push((~shellcode[i]) & 0xff);
  }
  const scLen = shellcode.length;

  const stub = [
    '; 反转+NOT 解码桩 (Linux x86_64)',
    '; 原理: 先 NOT 还原, 再反向写入内存, 最后跳转执行',
    `; 原始长度: ${scLen} 字节`,
    '',
    'section .text',
    'global _start',
    '_start:',
    '    jmp short call_decoder',
    '',
    'decoder:',
    '    pop rsi                     ; rsi = 编码数据末尾 +1',
    `    mov rcx, ${scLen}            ; rcx = 字节数`,
    '    sub rsi, rcx                ; rsi 指向编码数据起始',
    '    ; 在栈上构建可执行区域, 反向解码到 rdi',
    '    mov rdi, rsp                ; 使用栈空间 (注意可执行性)',
    '',
    'decode_loop:',
    '    mov al, [rsi]               ; 取编码字节',
    '    not al                      ; NOT 还原',
    '    mov [rdi], al               ; 写入正向位置',
    '    inc rsi',
    '    inc rdi',
    '    dec rcx',
    '    jnz decode_loop',
    '',
    '    jmp rsp                     ; 跳入栈上解码后的 shellcode',
    '',
    'call_decoder:',
    '    call decoder',
    '',
    '; --- 反转+NOT 后的数据 ---',
    `; db ${reversed.map((b) => '0x' + hexStr(b)).join(', ')}`,
  ].join('\n');

  return [
    '── 反转+NOT 编码结果 ──',
    '',
    `[原始长度] ${scLen} 字节`,
    '',
    '[编码 hex]',
    bytesToHex(new Uint8Array(reversed)),
    '',
    '[操作步骤]',
    '1. 原 shellcode 字节序反转',
    '2. 每个字节按位取反 (NOT)',
    '',
    '── 解码桩 (decoder stub) ──',
    '',
    stub,
  ].join('\n');
};

/* ---------- Execute ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Shellcode编码器"
    paramsConfig={[
      {
        name: 'key',
        label: 'XOR密钥',
        type: 'text',
        default: '90',
        placeholder: 'hex字节, 如 90',
      },
    ]}
    modeOptions={[
      { value: 'xor', label: 'XOR编码' },
      { value: 'alphanumeric', label: '字母数字' },
      { value: 'unicode', label: 'Unicode安全' },
      { value: 'reverse-not', label: '反转+NOT' },
    ]}
    execute={(
      input: string,
      mode: string,
      params: Record<string, unknown>,
    ): string => {
      const sc = parseHex(input);
      const key = (params.key as string) ?? '90';
      switch (mode) {
        case 'xor':
          return xorEncode(sc, key);
        case 'alphanumeric':
          return alphanumericEncode(sc);
        case 'unicode':
          return unicodeSafeEncode(sc);
        case 'reverse-not':
          return reverseNotEncode(sc);
        default:
          return xorEncode(sc, key);
      }
    }}
  />
);

export default ToolComponent;
