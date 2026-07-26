'use strict';

const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'dist', 'client', 'index.html');
let html;
try {
  html = fs.readFileSync(indexPath, 'utf8');
} catch (error) {
  throw new Error(`Cannot read built client HTML at ${indexPath}: ${error.message}`);
}

const nonceAttribute = 'nonce="{{cspNonce}}"';
const updated = html.replace(/<script\b([^>]*)>/giu, (tag, attributes) => {
  return /\bnonce\s*=/iu.test(attributes)
    ? tag
    : `<script ${nonceAttribute}${attributes}>`;
});

if (updated === html) {
  throw new Error('No script tags were updated with a CSP nonce');
}

fs.writeFileSync(indexPath, updated, 'utf8');

require('./post-build.cjs');
