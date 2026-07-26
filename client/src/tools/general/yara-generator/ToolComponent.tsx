import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function generateStringRule(name: string, input: string): string {
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let rule = `rule ${name} {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated string match rule"\n`;
  rule += `        date = "${new Date().toISOString().split('T')[0]}"\n`;
  rule += `\n    strings:\n`;
  for (let i = 0; i < lines.length; i++) {
    const escaped = lines[i].replace(/"/g, '\\"');
    rule += `        $s${i + 1} = "${escaped}"\n`;
  }
  rule += `\n    condition:\n`;
  rule += `        ${lines.map((_: string, i: number) => `$s${i + 1}`).join(' or ')}\n`;
  rule += `}\n`;
  return rule;
}

function generateHexRule(name: string, input: string): string {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s:,-]/g, '').toUpperCase();
  let formatted = '';
  for (let i = 0; i < cleaned.length; i += 2) {
    if (i > 0) formatted += ' ';
    formatted += cleaned.substring(i, i + 2);
  }
  let rule = `rule ${name} {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated hex pattern rule"\n`;
  rule += `\n    strings:\n`;
  rule += `        $hex = { ${formatted} }\n`;
  rule += `\n    condition:\n`;
  rule += `        $hex\n`;
  rule += `}\n`;
  return rule;
}

function generateRegexRule(name: string, input: string): string {
  const patterns = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let rule = `rule ${name} {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated regex rule"\n`;
  rule += `\n    strings:\n`;
  for (let i = 0; i < patterns.length; i++) {
    rule += `        $r${i + 1} = /${patterns[i]}/\n`;
  }
  rule += `\n    condition:\n`;
  rule += `        ${patterns.map((_: string, i: number) => `$r${i + 1}`).join(' or ')}\n`;
  rule += `}\n`;
  return rule;
}

function generateNibbleRule(name: string, input: string): string {
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let rule = `rule ${name} {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated nibble match rule"\n`;
  rule += `\n    strings:\n`;
  for (let i = 0; i < lines.length; i++) {
    let hex = '';
    for (let j = 0; j < lines[i].length; j += 3) {
      const pair = lines[i].substring(j, j + 2);
      const wildcard = lines[i].substring(j + 2, j + 3);
      hex += pair;
      if (wildcard === '?' || wildcard === '*') hex += '?';
      hex += ' ';
    }
    rule += `        $n${i + 1} = { ${hex.trim()} }\n`;
  }
  rule += `\n    condition:\n`;
  rule += `        ${lines.map((_: string, i: number) => `$n${i + 1}`).join(' or ')}\n`;
  rule += `}\n`;
  return rule;
}

function generateConditionRule(name: string, input: string): string {
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let rule = `rule ${name} {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated condition rule"\n`;
  rule += `\n    strings:\n`;
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split('=');
    if (parts.length === 2) {
      const varName = parts[0].trim();
      const value = parts[1].trim();
      if (/^[0-9A-Fa-f]+$/.test(value.replace(/\s/g, '')) && value.replace(/\s/g, '').length >= 4) {
        let formatted = '';
        const hex = value.replace(/\s/g, '');
        for (let j = 0; j < hex.length; j += 2) {
          if (j > 0) formatted += ' ';
          formatted += hex.substring(j, j + 2);
        }
        rule += `        $${varName} = { ${formatted} }\n`;
      } else {
        const escaped = value.replace(/"/g, '\\"');
        rule += `        $${varName} = "${escaped}"\n`;
      }
    }
  }
  rule += `\n    condition:\n`;
  const conditions = lines.map((l: string) => {
    const parts = l.split('=');
    return parts.length === 2 ? `$${parts[0].trim()}` : l;
  });
  rule += `        ${conditions.join(' and ')}\n`;
  rule += `}\n`;
  return rule;
}

function generateOverlayRule(name: string, input: string): string {
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let rule = `rule ${name} : overlay {\n`;
  rule += `    meta:\n`;
  rule += `        description = "Auto-generated overlay rule"\n`;
  rule += `\n    strings:\n`;
  for (let i = 0; i < lines.length; i++) {
    const escaped = lines[i].replace(/"/g, '\\"');
    rule += `        $o${i + 1} = "${escaped}"\n`;
  }
  rule += `\n    condition:\n`;
  rule += `        uint16(0) == 0x5A4D and\n`;
  rule += `        ${lines.map((_: string, i: number) => `$o${i + 1}`).join(' and ')}\n`;
  rule += `}\n`;
  return rule;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="YARA 规则生成器"
    paramsConfig={[
      {
        name: 'rule_type',
        label: '规则类型',
        type: 'select',
        default: 'string',
        options: [
          { value: 'string', label: '字符串匹配' },
          { value: 'hex', label: 'Hex 字节' },
          { value: 'regex', label: '正则表达式' },
          { value: 'nibble', label: 'Nibble 通配' },
          { value: 'condition', label: '条件组合' },
          { value: 'overlay', label: 'PE Overlay' },
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
      const ruleType = (params.rule_type as string) || 'string';
      const name = (params.name as string) || 'rule_001';
      const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');

      switch (ruleType) {
        case 'string':
          return generateStringRule(safeName, input);
        case 'hex':
          return generateHexRule(safeName, input);
        case 'regex':
          return generateRegexRule(safeName, input);
        case 'nibble':
          return generateNibbleRule(safeName, input);
        case 'condition':
          return generateConditionRule(safeName, input);
        case 'overlay':
          return generateOverlayRule(safeName, input);
        default:
          throw new Error(`未知规则类型: ${ruleType}`);
      }
    }}
  />
);

export default ToolComponent;
