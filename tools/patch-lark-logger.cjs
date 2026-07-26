'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@lark-apaas',
  'nestjs-logger',
  'dist',
);
const files = ['index.js', 'index.cjs'];
const unsafeBodyLogging = [
  '        if (req.body) responseData.request_body = req.body;',
  '        if (data) responseData.response = data;',
].join('\n');
const replacement = '        // SECURITY: request and response bodies are never sent to platform logs.';

for (const file of files) {
  const filePath = path.join(packageDir, file);
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${filePath}: ${error.message}`);
  }

  if (source.includes(replacement)) continue;
  if (!source.includes(unsafeBodyLogging)) {
    process.stdout.write(`Skipping ${file}: unsafe logger body block not found (already safe or different version).\n`);
    continue;
  }

  source = source.replace(unsafeBodyLogging, replacement);
  fs.writeFileSync(filePath, source, 'utf8');
}
