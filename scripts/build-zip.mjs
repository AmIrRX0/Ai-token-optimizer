// ============================================================
//  build-zip.mjs — package the loadable extension into a zip
//  for the Chrome Web Store / GitHub release attachment.
//
//  Usage: node scripts/build-zip.mjs
//  Output: dist/ai-token-saver-v<version>.zip
//
//  No dependencies — shells out to the system `zip` (macOS/Linux)
//  or PowerShell Compress-Archive (Windows).
// ============================================================

import { readFileSync, mkdirSync, rmSync, existsSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const version = manifest.version;

// Only these paths are shipped to users — everything else (tests,
// CI, scripts, docs, node_modules) stays out of the package.
const INCLUDE = [
  'manifest.json',
  'background.js',
  'content',
  'popup',
  'options',
  'utils',
  'icons',
  'README.md',
  'LICENSE',
];

const dist = join(root, 'dist');
const stage = join(dist, 'pkg');
const zipName = `ai-token-saver-v${version}.zip`;
const zipPath = join(dist, zipName);

// Fresh staging dir.
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

for (const item of INCLUDE) {
  const src = join(root, item);
  if (!existsSync(src)) {
    console.warn(`! skipping missing: ${item}`);
    continue;
  }
  cpSync(src, join(stage, item), { recursive: true });
}

// Zip the staged folder's CONTENTS (so manifest.json sits at the zip root).
if (platform() === 'win32') {
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${join(stage, '*')}' -DestinationPath '${zipPath}' -Force`,
    ],
    { stdio: 'inherit' }
  );
} else {
  execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: stage, stdio: 'inherit' });
}

rmSync(stage, { recursive: true, force: true });
console.log(`\n✓ Built dist/${zipName}`);
console.log('  Load it via chrome://extensions → Load unpacked (unzipped), or');
console.log('  upload the zip to the Chrome Web Store dashboard.');
