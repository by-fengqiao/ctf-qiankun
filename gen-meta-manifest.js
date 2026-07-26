const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'client', 'src', 'tools');

function findMetaFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '_shared' && !entry.name.startsWith('.')) {
      const metaFile = path.join(fullPath, 'meta.ts');
      if (fs.existsSync(metaFile)) {
        results.push(metaFile);
      }
      results.push(...findMetaFiles(fullPath));
    }
  }
  return results;
}

function extractString(content, field) {
  const regex = new RegExp(`${field}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
  const m = content.match(regex);
  return m ? m[1] : '';
}

function extractArray(content, field) {
  const regex = new RegExp(`${field}\\s*:\\s*\\[([^\\]]+)\\]`);
  const m = content.match(regex);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim().replace(/^['"`]|['"`]$/g, '')).filter(Boolean);
}

function extractBool(content, field) {
  const regex = new RegExp(`${field}\\s*:\\s*(true|false)`);
  const m = content.match(regex);
  return m ? m[1] === 'true' : undefined;
}

function extractDefaultParams(content) {
  const regex = /defaultParams\s*:\s*\{([^}]+)\}/;
  const m = content.match(regex);
  if (!m) return undefined;
  const raw = m[1].trim();
  if (!raw) return undefined;
  return raw;
}

function parseMeta(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const id = extractString(content, 'id');
  const name = extractString(content, 'name');
  const description = extractString(content, 'description');
  const category = extractString(content, 'category');
  const group = extractString(content, 'group');
  const keywords = extractArray(content, 'keywords');
  const modes = extractArray(content, 'modes');
  const hasFileInput = extractBool(content, 'hasFileInput');
  const exampleInput = extractString(content, 'exampleInput');
  const defaultParams = extractDefaultParams(content);

  if (!id || !category) return null;

  const lines = [];
  lines.push('  {');
  lines.push(`    id: '${id}',`);
  lines.push(`    name: '${name}',`);
  if (description) lines.push(`    description: '${description}',`);
  lines.push(`    category: '${category}',`);
  if (group) lines.push(`    group: '${group}',`);
  lines.push(`    keywords: [${keywords.map(k => `'${k}'`).join(', ')}],`);
  lines.push(`    modes: [${modes.map(m => `'${m}'`).join(', ')}],`);
  if (hasFileInput !== undefined) lines.push(`    hasFileInput: ${hasFileInput},`);
  if (exampleInput) lines.push(`    exampleInput: '${exampleInput}',`);
  if (defaultParams) lines.push(`    defaultParams: { ${defaultParams} },`);
  lines.push('  },');
  return lines.join('\n');
}

const metaFiles = findMetaFiles(toolsDir);
const entries = [];
for (const metaFile of metaFiles) {
  const parsed = parseMeta(metaFile);
  if (parsed) entries.push(parsed);
}

entries.sort((a, b) => {
  const aCat = a.match(/category: '([^']+)'/)?.[1] || '';
  const bCat = b.match(/category: '([^']+)'/)?.[1] || '';
  if (aCat !== bCat) return aCat.localeCompare(bCat);
  const aId = a.match(/id: '([^']+)'/)?.[1] || '';
  const bId = b.match(/id: '([^']+)'/)?.[1] || '';
  return aId.localeCompare(bId);
});

const output = `// 自动生成文件 - 请勿手动编辑。新增工具后运行 node gen-meta-manifest.js 重新生成
import type { ToolDefinition } from "./types";

export const allToolDefinitions: ToolDefinition[] = [
${entries.join('\n')}
];
`;

fs.writeFileSync(path.join(toolsDir, 'meta-manifest.ts'), output);
console.log(`Generated meta-manifest.ts with ${entries.length} tool definitions`);
