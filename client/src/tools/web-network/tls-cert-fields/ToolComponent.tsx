import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface CertField {
  field: string;
  desc: string;
}

const FIELDS: CertField[] = [
  { field: 'Version', desc: '证书版本号 (通常为 v3)' },
  { field: 'Serial Number', desc: '证书序列号，CA 签发的唯一标识' },
  { field: 'Signature Algorithm', desc: '签名算法 (如 SHA256-RSA)' },
  { field: 'Issuer', desc: '颁发者 (CA 的可分辨名称 DN)' },
  { field: 'Validity Not Before', desc: '证书生效时间' },
  { field: 'Validity Not After', desc: '证书过期时间' },
  { field: 'Subject', desc: '主体 (持有者的可分辨名称 DN)' },
  { field: 'Subject Public Key Algorithm', desc: '公钥算法 (RSA/ECDSA)' },
  { field: 'Subject Public Key', desc: '公钥内容' },
  { field: 'Subject Alternative Name (SAN)', desc: '主题备用名，包含域名/IP 列表' },
  { field: 'Key Usage', desc: '密钥用途 (签名、加密等)' },
  { field: 'Extended Key Usage', desc: '扩展密钥用途 (服务器认证、客户端认证)' },
  { field: 'Basic Constraints', desc: '基本约束 (是否为 CA 证书)' },
  { field: 'Subject Key Identifier', desc: '主体密钥标识符 (公钥哈希)' },
  { field: 'Authority Key Identifier', desc: '颁发机构密钥标识符' },
  { field: 'CRL Distribution Points', desc: '证书吊销列表分发点' },
  { field: 'Authority Information Access', desc: '颁发机构信息访问 (OCSP 地址)' },
  { field: 'Certificate Policies', desc: '证书策略' },
];

const SUBJECT_FIELDS: CertField[] = [
  { field: 'CN (Common Name)', desc: '通用名称，通常为域名' },
  { field: 'O (Organization)', desc: '组织名称' },
  { field: 'OU (Organizational Unit)', desc: '组织单位' },
  { field: 'L (Locality)', desc: '城市/地区' },
  { field: 'ST (State)', desc: '州/省' },
  { field: 'C (Country)', desc: '国家代码 (如 CN、US)' },
  { field: 'STREET', desc: '街道地址' },
  { field: 'emailAddress', desc: '邮箱地址' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(): string => {
      const lines: string[] = ['=== X.509 TLS 证书字段参考 ===', ''];
      lines.push('--- 核心字段 ---');
      for (const f of FIELDS) {
        lines.push(`${f.field}: ${f.desc}`);
      }
      lines.push('');
      lines.push('--- Subject/Issuer DN 字段 ---');
      for (const f of SUBJECT_FIELDS) {
        lines.push(`${f.field}: ${f.desc}`);
      }
      lines.push('');
      lines.push('--- 查看证书命令 ---');
      lines.push('openssl x509 -in cert.pem -text -noout');
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
