import AsyncTool from '../../_shared/AsyncTool';
import { parseHex, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

function decodeBase64(str: string): string {
  try {
    const binary = atob(str.replace(/\\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytesToText(bytes);
  } catch {
    return '(base64 解码失败)';
  }
}

function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\\r?\\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_match: string, hex: string) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  encoding: string;
  size: number;
  preview: string;
}

interface EmailPart {
  headers: Record<string, string>;
  body: string;
  contentType: string;
  children: EmailPart[];
}

function parseHeaders(text: string, start: number, end: number): { headers: Record<string, string>; bodyStart: number } {
  const headers: Record<string, string> = {};
  const headerText = text.substring(start, end);
  const lines = headerText.split(/\\r?\\n/);
  let currentKey = '';
  let currentVal = '';
  for (const line of lines) {
    if (line === '') {
      if (currentKey) headers[currentKey.toLowerCase()] = currentVal.trim();
      break;
    }
    if (/^\\s/.test(line) && currentKey) {
      currentVal += ' ' + line.trim();
    } else {
      if (currentKey) headers[currentKey.toLowerCase()] = currentVal.trim();
      const colonIdx = line.indexOf(':');
      if (colonIdx >= 0) {
        currentKey = line.substring(0, colonIdx).trim();
        currentVal = line.substring(colonIdx + 1).trim();
      }
    }
  }
  if (currentKey && !headers[currentKey.toLowerCase()]) {
    headers[currentKey.toLowerCase()] = currentVal.trim();
  }
  const headerEnd = text.indexOf('\\n\\n', start);
  const bodyStart = headerEnd >= 0 && headerEnd < end ? headerEnd + 2 : end;
  return { headers, bodyStart };
}

function parseMIME(text: string, boundary: string, start: number): EmailPart[] {
  const parts: EmailPart[] = [];
  const boundaryMarker = '--' + boundary;
  let pos = text.indexOf(boundaryMarker, start);
  while (pos >= 0) {
    const partStart = pos + boundaryMarker.length;
    let lineEnd = text.indexOf('\\n', partStart);
    if (lineEnd < 0) break;
    const afterBoundary = text.substring(partStart, lineEnd).trim();
    if (afterBoundary === '--') break;
    
    const nextBoundary = text.indexOf(boundaryMarker, lineEnd);
    const partEnd = nextBoundary >= 0 ? nextBoundary : text.length;
    const partText = text.substring(lineEnd + 1, partEnd);
    
    const { headers, bodyStart } = parseHeaders(partText, 0, partText.length);
    const contentType = headers['content-type'] ?? 'text/plain';
    const body = partText.substring(bodyStart);
    
    const subBoundary = extractBoundary(contentType);
    let children: EmailPart[] = [];
    if (subBoundary && contentType.includes('multipart')) {
      children = parseMIME(partText, subBoundary, bodyStart);
    }
    
    parts.push({ headers, body, contentType, children });
    pos = nextBoundary;
  }
  return parts;
}

function extractBoundary(contentType: string): string {
  const m = /boundary="?([^";\\s]+)"?/i.exec(contentType);
  return m ? m[1] : '';
}

function collectAttachments(parts: EmailPart[], attachments: EmailAttachment[]): void {
  for (const part of parts) {
    const cd = part.headers['content-disposition'] ?? '';
    const ct = part.headers['content-type'] ?? 'text/plain';
    const cte = part.headers['content-transfer-encoding'] ?? '7bit';
    
    if (cd.includes('attachment') || (cd.includes('filename') && !cd.includes('inline'))) {
      const fnameMatch = /filename="?([^";\\n]+)"?/i.exec(cd);
      const filename = fnameMatch ? fnameMatch[1] : '(unnamed)';
      let decodedBody = part.body;
      if (cte.toLowerCase() === 'base64') {
        decodedBody = decodeBase64(part.body.trim());
      } else if (cte.toLowerCase() === 'quoted-printable') {
        decodedBody = decodeQuotedPrintable(part.body);
      }
      attachments.push({
        filename,
        contentType: ct.split(';')[0].trim(),
        encoding: cte,
        size: decodedBody.length,
        preview: decodedBody.substring(0, 100),
      });
    }
    
    if (part.children.length > 0) {
      collectAttachments(part.children, attachments);
    }
  }
}

function getBodyText(parts: EmailPart[]): { text: string; html: string } {
  let text = '';
  let html = '';
  for (const part of parts) {
    if (part.children.length > 0) {
      const sub = getBodyText(part.children);
      if (!text) text = sub.text;
      if (!html) html = sub.html;
      continue;
    }
    const ct = part.headers['content-type'] ?? 'text/plain';
    const cte = (part.headers['content-transfer-encoding'] ?? '7bit').toLowerCase();
    let body = part.body;
    if (cte === 'base64') {
      body = decodeBase64(body.trim());
    } else if (cte === 'quoted-printable') {
      body = decodeQuotedPrintable(body);
    }
    if (ct.includes('text/plain') && !text) {
      text = body;
    } else if (ct.includes('text/html') && !html) {
      html = body;
    }
  }
  return { text, html };
}

const parse = (rawText: string): string => {
  const text = rawText.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  EML 邮件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const { headers, bodyStart } = parseHeaders(text, 0, text.length);
  
  L.push('── 邮件头 ──');
  const headerKeys = ['from', 'to', 'cc', 'bcc', 'subject', 'date', 'message-id', 'reply-to', 
                       'mime-version', 'content-type', 'received', 'return-path', 'sender'];
  const headerLabels: Record<string, string> = {
    'from': '发件人', 'to': '收件人', 'cc': '抄送', 'bcc': '密送',
    'subject': '主题', 'date': '日期', 'message-id': '消息ID', 'reply-to': '回复至',
    'mime-version': 'MIME版本', 'content-type': '内容类型', 'received': '接收路径',
    'return-path': '返回路径', 'sender': '发件人(Sender)',
  };
  for (const key of headerKeys) {
    if (headers[key]) {
      const label = headerLabels[key] ?? key;
      L.push(`  ${label}: ${headers[key]}`);
    }
  }
  for (const [key, value] of Object.entries(headers)) {
    if (!headerKeys.includes(key)) {
      L.push(`  ${key}: ${value}`);
    }
  }
  L.push('');

  const received = headers['received'] ?? '';
  if (received) {
    L.push('── 路由信息 ──');
    const ipMatches = received.match(/\\b(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})\\b/g);
    if (ipMatches) {
      L.push(`  检测到IP地址: ${ipMatches.join(', ')}`);
    }
    L.push(`  ${received.substring(0, 200)}${received.length > 200 ? '...' : ''}`);
    L.push('');
  }

  const body = text.substring(bodyStart);
  const contentType = headers['content-type'] ?? 'text/plain';
  const boundary = extractBoundary(contentType);
  
  L.push('── 邮件正文 ──');
  if (boundary) {
    L.push(`  (MIME multipart, boundary: ${boundary})`);
    L.push('');
    const parts = parseMIME(body, boundary, 0);
    const { text: bodyText, html: bodyHtml } = getBodyText(parts);
    
    if (bodyText) {
      L.push('  [text/plain 部分]:');
      const lines = bodyText.split('\\n').slice(0, 30);
      for (const line of lines) L.push(`    ${line}`);
      if (bodyText.split('\\n').length > 30) L.push('    ...(已截断)');
      L.push('');
    }
    if (bodyHtml) {
      L.push('  [text/html 部分]:');
      const plainText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
      L.push(`    ${plainText.substring(0, 200)}${plainText.length > 200 ? '...' : ''}`);
      L.push('');
    }
    
    const attachments: EmailAttachment[] = [];
    collectAttachments(parts, attachments);
    L.push(`── 附件 (${attachments.length} 个) ──`);
    for (const att of attachments) {
      L.push(`  • ${att.filename}`);
      L.push(`    类型: ${att.contentType}`);
      L.push(`    编码: ${att.encoding}`);
      L.push(`    大小: ${att.size} 字节`);
      L.push(`    预览: ${att.preview.substring(0, 60)}`);
      L.push('');
    }
    if (attachments.length === 0) {
      L.push('  (无附件)');
      L.push('');
    }
  } else {
    const cte = (headers['content-transfer-encoding'] ?? '7bit').toLowerCase();
    let decodedBody = body;
    if (cte === 'base64') {
      decodedBody = decodeBase64(body.trim());
    } else if (cte === 'quoted-printable') {
      decodedBody = decodeQuotedPrintable(body);
    }
    L.push(`  编码: ${cte}`);
    L.push('');
    const lines = decodedBody.split('\\n').slice(0, 30);
    for (const line of lines) L.push(`  ${line}`);
    if (decodedBody.split('\\n').length > 30) L.push('  ...(已截断)');
    L.push('');
  }

  return L.join('\\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="EML邮件解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let text = input;
      if (file) {
        text = await readFileAsText(file);
      }
      const cleaned = input.replace(/0x/gi, '').replace(/[\\s:,-]/g, '');
      if (!file && cleaned.length >= 16 && cleaned.length % 2 === 0 && /^[0-9A-Fa-f]+$/.test(cleaned)) {
        text = bytesToText(parseHex(input));
      }
      if (!text.trim()) {
        throw new Error('输入为空');
      }
      return parse(text);
    }} />
);
export default ToolComponent;
