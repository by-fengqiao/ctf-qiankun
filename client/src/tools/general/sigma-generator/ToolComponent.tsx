import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const LOG_SOURCES: Record<string, { product: string; category?: string; service?: string }> = {
  windows: { product: 'windows' },
  process_creation: { product: 'windows', category: 'process_creation' },
  sysmon: { product: 'windows', service: 'sysmon' },
  registry_file: { category: 'registry_event', product: 'windows' },
  dns: { category: 'dns_query', product: 'windows' },
  antivirus: { product: 'windows', service: 'antivirus' },
};

function parseDetectionFields(input: string): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const field = line.substring(0, eqIdx).trim();
    const value = line.substring(eqIdx + 1).trim();
    if (!field || !value) continue;
    if (!fields[field]) fields[field] = [];
    fields[field].push(value);
  }
  return fields;
}

function yamlValue(val: string): string {
  if (/^\d+$/.test(val)) return val;
  if (val.includes('|')) return `"${val}"`;
  const needsQuote = /[:#{}\[\],&*?|<>=!%@`]/.test(val) || val.includes(' ');
  if (needsQuote) {
    return `"${val.replace(/"/g, '\\"')}"`;
  }
  return val;
}

function generateSigma(
  logSource: string,
  name: string,
  input: string,
): string {
  const ls = LOG_SOURCES[logSource] ?? { product: 'windows' };
  const fields = parseDetectionFields(input);
  const fieldKeys = Object.keys(fields);
  const date = new Date().toISOString().split('T')[0];

  let yaml = `title: ${name}\n`;
  yaml += `id: ${crypto.randomUUID()}\n`;
  yaml += `status: experimental\n`;
  yaml += `description: "Auto-generated Sigma rule"\n`;
  yaml += `date: ${date}\n`;
  yaml += `logsource:\n`;
  if (ls.product) yaml += `    product: ${ls.product}\n`;
  if (ls.category) yaml += `    category: ${ls.category}\n`;
  if (ls.service) yaml += `    service: ${ls.service}\n`;
  yaml += `detection:\n`;
  yaml += `    selection:\n`;
  for (const field of fieldKeys) {
    const values = fields[field];
    if (values.length === 1) {
      yaml += `        ${field}|contains: ${yamlValue(values[0])}\n`;
    } else {
      yaml += `        ${field}:\n`;
      for (const v of values) {
        yaml += `            - ${yamlValue(v)}\n`;
      }
    }
  }
  yaml += `    condition: selection\n`;
  yaml += `fields:\n`;
  for (const field of fieldKeys) {
    yaml += `    - ${field}\n`;
  }
  yaml += `falsepositives:\n`;
  yaml += `    - Unknown\n`;
  yaml += `level: medium\n`;
  return yaml;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Sigma 规则生成器"
    paramsConfig={[
      {
        name: 'log_source',
        label: '日志源',
        type: 'select',
        default: 'process_creation',
        options: [
          { value: 'windows', label: 'Windows 通用' },
          { value: 'process_creation', label: '进程创建' },
          { value: 'sysmon', label: 'Sysmon' },
          { value: 'registry_file', label: '注册表事件' },
          { value: 'dns', label: 'DNS 查询' },
          { value: 'antivirus', label: '杀毒软件' },
        ],
      },
      {
        name: 'name',
        label: '规则名',
        type: 'text',
        default: 'rule_001',
        placeholder: 'rule_001',
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const logSource = (params.log_source as string) || 'process_creation';
      const name = (params.name as string) || 'rule_001';
      return generateSigma(logSource, name, input);
    }}
  />
);

export default ToolComponent;
