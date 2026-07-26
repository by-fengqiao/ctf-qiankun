const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const file = resolve(process.cwd(), 'docs/openapi.json');
const document = JSON.parse(readFileSync(file, 'utf8'));

if (document.openapi !== '3.1.0') {
  throw new Error('docs/openapi.json must declare OpenAPI 3.1.0');
}
if (!document.info?.title || !document.info?.version) {
  throw new Error('OpenAPI info.title and info.version are required');
}
if (!document.paths || typeof document.paths !== 'object') {
  throw new Error('OpenAPI paths are required');
}

for (const path of Object.keys(document.paths)) {
  if (!path.startsWith('/openapi/v1/')) {
    throw new Error(`Public API path is not versioned: ${path}`);
  }
}

if (!document.components?.schemas?.ErrorResponse) {
  throw new Error('OpenAPI ErrorResponse schema is required');
}

process.stdout.write('OpenAPI document is valid JSON and has the required v1 contract metadata.\n');
