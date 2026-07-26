'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function copyRunSh() {
  const src = path.join(ROOT, 'scripts', 'run.sh');
  const dst = path.join(DIST, 'run.sh');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o755);
    console.log('[post-build] Copied run.sh to dist/');
  } else {
    console.warn('[post-build] scripts/run.sh not found, skip copy');
  }
}

function copyEnv() {
  const src = path.join(ROOT, '.env');
  const dst = path.join(DIST, '.env');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log('[post-build] Copied .env to dist/');
  }
}

function moveHtmlFiles() {
  const clientDir = path.join(DIST, 'client');
  if (!fs.existsSync(clientDir)) return;
  const targetDir = path.join(DIST, 'dist', 'client');
  fs.mkdirSync(targetDir, { recursive: true });
  const htmlFiles = fs.readdirSync(clientDir).filter((f) => f.endsWith('.html'));
  for (const f of htmlFiles) {
    const src = path.join(clientDir, f);
    const dst = path.join(targetDir, f);
    fs.renameSync(src, dst);
    console.log(`[post-build] Moved ${f} to dist/dist/client/`);
  }
}

function runPruneSmart() {
  const onlyFrontend = process.env.only_frontend_change === 'true';
  if (onlyFrontend) {
    console.log('[post-build] Skip prune-smart (only_frontend_change=true)');
    return;
  }
  const pruneScript = path.join(ROOT, 'scripts', 'prune-smart.js');
  if (!fs.existsSync(pruneScript)) {
    console.warn('[post-build] scripts/prune-smart.js not found, skip prune');
    return;
  }
  try {
    execSync(`node "${pruneScript}"`, { cwd: ROOT, stdio: 'inherit' });
    console.log('[post-build] Prune-smart completed');
  } catch (err) {
    console.warn('[post-build] prune-smart failed:', err.message);
  }
}

function cleanup() {
  const targets = [
    path.join(DIST, 'scripts'),
    path.join(DIST, 'tsconfig.node.tsbuildinfo'),
  ];
  for (const t of targets) {
    if (fs.existsSync(t)) {
      fs.rmSync(t, { recursive: true, force: true });
      console.log(`[post-build] Cleaned up ${path.relative(DIST, t)}`);
    }
  }
}

copyRunSh();
copyEnv();
moveHtmlFiles();
cleanup();
runPruneSmart();

console.log('[post-build] Done');
