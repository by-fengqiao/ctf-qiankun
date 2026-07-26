import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const computeEntropy = (text: string): number => {
  const freq = new Map<string, number>();
  for (const c of text) {
    freq.set(c, (freq.get(c) || 0) + 1);
  }
  const n = text.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

interface Candidate {
  type: string;
  confidence: number;
  description: string;
  nextSteps: string;
}

const isHex = (text: string): boolean => /^[0-9a-fA-F\s]+$/.test(text) && text.trim().length >= 2;
const isBase64 = (text: string): boolean => /^[A-Za-z0-9+/\n\r=]+$/.test(text.trim()) && text.trim().length >= 4;
const isBase32 = (text: string): boolean => /^[A-Z2-7=\s]+$/.test(text.trim()) && text.trim().length >= 8;
const isBase58 = (text: string): boolean => /^[1-9A-HJ-NP-Za-km-z]+$/.test(text.trim());
const isBase85 = (text: string): boolean => {
  const t = text.trim();
  return t.length > 0 && /^[0-9A-Za-z!#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+$/.test(t);
};
const isBinary = (text: string): boolean => /^[01\s]+$/.test(text.trim()) && text.trim().length >= 8;

const isJWT = (text: string): boolean => {
  const parts = text.trim().split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0 && isBase64(p));
};

const isPEM = (text: string): boolean =>
  /-----BEGIN [A-Z0-9 ]+-----[\s\S]*-----END [A-Z0-9 ]+-----/.test(text);

const isSSHKey = (text: string): boolean =>
  /^(ssh-rsa|ssh-ed25519|ssh-dss|ecdsa-sha2-nistp\d+) /.test(text.trim());

const isBitcoinAddress = (text: string): boolean =>
  /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(text.trim());

const isUUID = (text: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text.trim());

const isURL = (text: string): boolean =>
  /^https?:\/\/[^\s]+$/i.test(text.trim());

const isEmail = (text: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

const hasRepeatingBlocks = (text: string): boolean => {
  const clean = text.replace(/\s/g, '');
  if (clean.length < 32) return false;
  const blockSize = 16;
  const blocks: string[] = [];
  for (let i = 0; i + blockSize <= clean.length; i += blockSize) {
    blocks.push(clean.slice(i, i + blockSize));
  }
  const unique = new Set(blocks);
  return unique.size < blocks.length;
};

const execute = (input: string): string => {
  const text = input.trim();
  if (!text) return '请输入要识别的内容';

  const candidates: Candidate[] = [];
  const entropy = computeEntropy(text);
  const length = text.length;
  const byteLen = new TextEncoder().encode(text).length;

  const lines: string[] = [];
  lines.push('=== 密码编码识别器 ===');
  lines.push('');
  lines.push('--- 基本信息 ---');
  lines.push(`字符长度: ${length}`);
  lines.push(`字节长度: ${byteLen}`);
  lines.push(`Shannon 熵: ${entropy.toFixed(4)} bits/char`);
  const uniqueChars = new Set(text).size;
  lines.push(`唯一字符数: ${uniqueChars}`);
  lines.push('');

  lines.push('--- 字符集分析 ---');
  const charsetChecks: { name: string; test: boolean; desc: string }[] = [
    { name: 'Hex', test: isHex(text), desc: '0-9a-f' },
    { name: 'Base64', test: isBase64(text), desc: 'A-Za-z0-9+/=' },
    { name: 'Base32', test: isBase32(text), desc: 'A-Z2-7=' },
    { name: 'Base58', test: isBase58(text), desc: 'Bitcoin base58' },
    { name: 'Base85', test: isBase85(text), desc: 'Ascii85' },
    { name: 'Binary', test: isBinary(text), desc: '0-1' },
  ];
  for (const c of charsetChecks) {
    if (c.test) {
      lines.push(`  ${c.name}: ✓ (${c.desc})`);
    }
  }
  lines.push('');

  lines.push('--- 结构模式检测 ---');
  if (isJWT(text)) {
    candidates.push({
      type: 'JWT (JSON Web Token)',
      confidence: 95,
      description: '3段 base64url 用 . 分隔',
      nextSteps: '解码 header.payload 查看算法和用户信息',
    });
  }
  if (isPEM(text)) {
    candidates.push({
      type: 'PEM 证书/密钥',
      confidence: 95,
      description: 'BEGIN/END 格式',
      nextSteps: '提取 base64 内容, 用 openssl 解析',
    });
  }
  if (isSSHKey(text)) {
    candidates.push({
      type: 'SSH 公钥',
      confidence: 95,
      description: 'ssh-* 开头',
      nextSteps: '用 ssh-keygen -L 查看详细信息',
    });
  }
  if (isBitcoinAddress(text)) {
    candidates.push({
      type: 'Bitcoin 地址',
      confidence: 90,
      description: 'BTC 地址格式',
      nextSteps: '使用区块链浏览器查询',
    });
  }
  if (isUUID(text)) {
    candidates.push({
      type: 'UUID',
      confidence: 95,
      description: '标准 UUID 格式',
      nextSteps: '检查版本号 (第3段首位)',
    });
  }
  if (isURL(text)) {
    candidates.push({
      type: 'URL',
      confidence: 95,
      description: 'http/https 协议',
      nextSteps: '解析 URL 组件或访问',
    });
  }
  if (isEmail(text)) {
    candidates.push({
      type: 'Email',
      confidence: 95,
      description: '标准邮箱格式',
      nextSteps: '检查域名或用户名',
    });
  }

  if (hasRepeatingBlocks(text)) {
    candidates.push({
      type: 'ECB 模式密文 (重复块)',
      confidence: 70,
      description: '检测到重复的16字节块',
      nextSteps: '使用 ECB 模式攻击工具',
    });
  }

  if (isHex(text) && text.replace(/\s/g, '').length % 2 === 0) {
    const hexClean = text.replace(/\s/g, '');
    const hexLen = hexClean.length / 2;
    candidates.push({
      type: 'Hex 编码',
      confidence: 80,
      description: `${hexLen} 字节十六进制`,
      nextSteps: hexLen === 16 ? '可能是 MD5 哈希' :
                 hexLen === 20 ? '可能是 SHA-1 哈希' :
                 hexLen === 32 ? '可能是 AES 密文(1块) 或 MD5(x2)' :
                 hexLen === 64 ? '可能是 SHA-256 哈希 或 ECDSA 签名' :
                 `解码为字节, 尝试 ASCII 或其他编码`,
    });
  }

  if (isBase64(text) && text.trim().length >= 4) {
    const b64Clean = text.trim().replace(/\s/g, '');
    const padding = (b64Clean.match(/=/g) || []).length;
    candidates.push({
      type: 'Base64 编码',
      confidence: 70,
      description: `Base64 (${padding} 个 = 填充)`,
      nextSteps: '解码后检查是否为可读文本或二进制',
    });
  }

  if (isBase32(text) && text.trim().length >= 8) {
    candidates.push({
      type: 'Base32 编码',
      confidence: 60,
      description: 'Base32 (A-Z2-7)',
      nextSteps: '解码后检查内容',
    });
  }

  if (entropy > 4.5 && !isHex(text) && !isBase64(text) && !isBase32(text)) {
    candidates.push({
      type: '加密数据 / 随机数据',
      confidence: 50,
      description: `高熵 (${entropy.toFixed(2)} bits), 无明显编码模式`,
      nextSteps: '可能是 AES/RC4 等对称加密结果, 需要密钥',
    });
  }

  if (entropy < 3.0 && uniqueChars > 5) {
    candidates.push({
      type: '自然语言 / 低熵文本',
      confidence: 50,
      description: `低熵 (${entropy.toFixed(2)} bits), 可能是可读文本`,
      nextSteps: '检查是否为替换密码或移位密码',
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  lines.push('--- 识别结果 (按置信度排序) ---');
  if (candidates.length === 0) {
    lines.push('未识别到已知编码格式');
  } else {
    for (const c of candidates) {
      lines.push('');
      lines.push(`[${c.confidence}%] ${c.type}`);
      lines.push(`  描述: ${c.description}`);
      lines.push(`  下一步: ${c.nextSteps}`);
    }
  }

  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="密码编码识别器"
    execute={(input: string) => execute(input)}
  />
);

export default ToolComponent;
