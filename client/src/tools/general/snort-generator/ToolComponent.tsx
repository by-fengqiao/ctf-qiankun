import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface SnortFields {
  msg?: string;
  sid?: string;
  rev?: string;
  content?: string[];
  depth?: string;
  offset?: string;
  pcre?: string;
  classtype?: string;
  priority?: string;
  dport?: string;
  sport?: string;
  ttl?: string;
  id?: string;
  ack?: string;
  flags?: string;
}

function parseSnortFields(input: string): SnortFields {
  const fields: SnortFields = {};
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.substring(0, eqIdx).trim().toLowerCase();
    const value = line.substring(eqIdx + 1).trim();
    if (!key || !value) continue;

    if (key === 'content') {
      if (!fields.content) fields.content = [];
      fields.content.push(value);
    } else {
      (fields as Record<string, unknown>)[key] = value;
    }
  }
  return fields;
}

function generateSnort(
  action: string,
  proto: string,
  input: string,
): string {
  const fields = parseSnortFields(input);
  const sid = fields.sid || '1000001';
  const rev = fields.rev || '1';

  let src = 'any';
  let sport = fields.sport || 'any';
  let dst = 'any';
  let dport = fields.dport || 'any';

  let rule = `${action} ${proto} ${src} ${sport} -> ${dst} ${dport} (`;

  const options: string[] = [];

  if (fields.msg) {
    options.push(`msg:"${fields.msg}"`);
  }

  if (fields.content) {
    for (const content of fields.content) {
      let contentOpt = `content:"${content}"`;
      if (fields.depth) contentOpt += `,depth:${fields.depth}`;
      if (fields.offset) contentOpt += `,offset:${fields.offset}`;
      options.push(contentOpt);
    }
  }

  if (fields.pcre) {
    const pcrePattern = fields.pcre.startsWith('/') ? fields.pcre : `/${fields.pcre}/`;
    options.push(`pcre:"${pcrePattern}"`);
  }

  if (fields.ttl) options.push(`ttl:${fields.ttl}`);
  if (fields.id) options.push(`id:${fields.id}`);
  if (fields.ack) options.push(`ack:${fields.ack}`);
  if (fields.flags) options.push(`flags:${fields.flags}`);

  options.push(`classtype:${fields.classtype || 'trojan-activity'}`);
  options.push(`priority:${fields.priority || '1'}`);
  options.push(`sid:${sid}`);
  options.push(`rev:${rev}`);

  rule += options.join('; ');
  rule += `)\n`;

  let output = '=== 生成的 Snort 规则 ===\n\n';
  output += rule;
  output += '\n--- 规则说明 ---\n';
  output += `动作: ${action}\n`;
  output += `协议: ${proto}\n`;
  output += `源: ${src}:${sport}\n`;
  output += `目标: ${dst}:${dport}\n`;
  output += `SID: ${sid}\n`;
  output += `Revision: ${rev}\n`;
  if (fields.classtype) output += `分类: ${fields.classtype}\n`;
  if (fields.content) {
    output += `内容匹配: ${fields.content.length} 个模式\n`;
  }
  if (fields.pcre) output += `正则匹配: 已配置\n`;

  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Snort 规则生成器"
    paramsConfig={[
      {
        name: 'action',
        label: '动作',
        type: 'select',
        default: 'alert',
        options: [
          { value: 'alert', label: 'alert' },
          { value: 'log', label: 'log' },
          { value: 'pass', label: 'pass' },
          { value: 'drop', label: 'drop' },
          { value: 'reject', label: 'reject' },
        ],
      },
      {
        name: 'proto',
        label: '协议',
        type: 'select',
        default: 'tcp',
        options: [
          { value: 'tcp', label: 'TCP' },
          { value: 'udp', label: 'UDP' },
          { value: 'icmp', label: 'ICMP' },
          { value: 'ip', label: 'IP' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const action = (params.action as string) || 'alert';
      const proto = (params.proto as string) || 'tcp';
      return generateSnort(action, proto, input);
    }}
  />
);

export default ToolComponent;
