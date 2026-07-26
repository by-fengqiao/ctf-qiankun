import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) || 'KEY';
      const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
      if (cleanKey.length === 0) return '请输入密钥';

      if (mode === 'encrypt') {
        let keyIdx = 0;
        const result: string[] = [];
        for (const ch of input) {
          if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
            const p = ch.toUpperCase().charCodeAt(0) - 65;
            const k = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
            result.push(String.fromCharCode(((p + k) % 26) + 65));
            keyIdx++;
          } else {
            result.push(ch);
          }
        }
        return result.join('');
      }

      if (mode === 'decrypt') {
        let keyIdx = 0;
        const result: string[] = [];
        for (const ch of input) {
          if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
            const c = ch.toUpperCase().charCodeAt(0) - 65;
            const k = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
            result.push(String.fromCharCode(((c - k + 26) % 26) + 65));
            keyIdx++;
          } else {
            result.push(ch);
          }
        }
        return result.join('');
      }

      // analyze mode: show table
      const text = input.toUpperCase().replace(/[^A-Z]/g, '');
      const lines: string[] = [];
      lines.push('维吉尼亚加密表 (Tabula Recta)');
      lines.push(`密钥: ${cleanKey}`);
      lines.push(`明文: ${text}`);
      lines.push('');

      let keyIdx = 0;
      const encrypted: string[] = [];
      for (const ch of text) {
        const k = cleanKey.charCodeAt(keyIdx % cleanKey.length) - 65;
        const p = ch.charCodeAt(0) - 65;
        const c = (p + k) % 26;
        const keyChar = cleanKey[keyIdx % cleanKey.length];
        lines.push(`${ch} + ${keyChar}(shift ${k}) → ${String.fromCharCode(c + 65)}`);
        encrypted.push(String.fromCharCode(c + 65));
        keyIdx++;
      }
      lines.push('');
      lines.push(`密文: ${encrypted.join('')}`);
      lines.push('');
      lines.push('--- 完整维吉尼亚表 ---');
      lines.push('   ' + Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).join(' '));
      for (let r = 0; r < 26; r++) {
        const row: string[] = [String.fromCharCode(65 + r) + ': '];
        for (let c = 0; c < 26; c++) {
          row.push(String.fromCharCode(65 + ((r + c) % 26)));
        }
        lines.push(row.join(' '));
      }
      return lines.join('\n');
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
      { value: 'analyze', label: '分析' },
    ]}
    paramsConfig={[
      { name: 'key', label: '密钥', type: 'text', placeholder: 'KEY', default: 'KEY' },
    ]}
  />
);

export default ToolComponent;
