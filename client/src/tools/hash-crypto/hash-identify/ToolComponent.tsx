import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface HashInfo {
  name: string;
  length: number;
  charset: RegExp;
}

const HASH_TYPES: HashInfo[] = [
  { name: 'MD5', length: 32, charset: /^[a-f0-9]+$/i },
  { name: 'MD4', length: 32, charset: /^[a-f0-9]+$/i },
  { name: 'NTLM', length: 32, charset: /^[a-f0-9]+$/i },
  { name: 'SHA1', length: 40, charset: /^[a-f0-9]+$/i },
  { name: 'SHA224', length: 56, charset: /^[a-f0-9]+$/i },
  { name: 'SHA256', length: 64, charset: /^[a-f0-9]+$/i },
  { name: 'SHA384', length: 96, charset: /^[a-f0-9]+$/i },
  { name: 'SHA512', length: 128, charset: /^[a-f0-9]+$/i },
  { name: 'RIPEMD160', length: 40, charset: /^[a-f0-9]+$/i },
  { name: 'SHA3-224', length: 56, charset: /^[a-f0-9]+$/i },
  { name: 'SHA3-256', length: 64, charset: /^[a-f0-9]+$/i },
  { name: 'SHA3-384', length: 96, charset: /^[a-f0-9]+$/i },
  { name: 'SHA3-512', length: 128, charset: /^[a-f0-9]+$/i },
  { name: 'MySQL323', length: 16, charset: /^[a-f0-9]+$/i },
  { name: 'MySQL5 / SHA1', length: 40, charset: /^[a-f0-9]+$/i },
  { name: 'CRC32', length: 8, charset: /^[a-f0-9]+$/i },
  { name: 'Adler32', length: 8, charset: /^[a-f0-9]+$/i },
  { name: 'BLAKE2s-256', length: 64, charset: /^[a-f0-9]+$/i },
  { name: 'BLAKE2b-512', length: 128, charset: /^[a-f0-9]+$/i },
  { name: 'Base64', length: 0, charset: /^[A-Za-z0-9+/]+={0,2}$/ },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const hash = input.trim();
      if (!hash) return '请输入哈希值';
      const matches: string[] = [];
      for (const ht of HASH_TYPES) {
        if (ht.charset.test(hash)) {
          if (ht.name === 'Base64') {
            if (hash.length % 4 === 0 && hash.length >= 4) {
              matches.push('Base64 (可能)');
            }
          } else if (ht.length === hash.length) {
            matches.push(ht.name);
          }
        }
      }
      const info = `长度: ${hash.length}\n字符集: ${/^[a-f0-9]+$/i.test(hash) ? '十六进制' : /^[A-Za-z0-9+/]+=*$/.test(hash) ? 'Base64字符' : '其他'}`;
      if (matches.length === 0) {
        return `${info}\n\n未识别到已知哈希类型`;
      }
      return `${info}\n\n可能的哈希类型:\n${matches.map((m: string) => `  - ${m}`).join('\n')}`;
    }}
  />
);
export default ToolComponent;
