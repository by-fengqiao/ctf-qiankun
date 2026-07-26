import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'salt', label: '盐值', type: 'text', placeholder: 'salt', default: 'salt' },
      { name: 'info', label: 'Info', type: 'text', placeholder: 'info', default: '' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const ikm = input;
      const salt = (params.salt as string) ?? 'salt';
      const info = (params.info as string) ?? '';
      // Extract: PRK = HMAC-SHA256(salt, ikm)
      const prkHex = CryptoJS.HmacSHA256(ikm, salt).toString();
      const prkWA = CryptoJS.enc.Hex.parse(prkHex);
      // Expand (SHA-256 => 32 bytes/block). L=256bit => N=1
      const infoBytes = new TextEncoder().encode(info);
      const infoHex = Array.from(infoBytes, (b: number) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
      const t1Msg = CryptoJS.enc.Hex.parse(infoHex + '01');
      const okmHex = CryptoJS.HmacSHA256(t1Msg, prkWA).toString();
      return [
        '=== HKDF (SHA-256, RFC 5869) ===',
        `盐值: ${salt}`,
        `Info: ${info || '(空)'}`,
        `PRK (伪随机密钥): ${prkHex}`,
        `OKM (输出密钥, 256 bit): ${okmHex}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
