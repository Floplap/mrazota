import { execSync } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// repository root is the parent directory of the script's parent (mrazota-site)
const repoRoot = path.resolve(path.dirname(__filename), '..');
const legacyDir = path.join(repoRoot, 'public', 'legacy_full');
const legacyDist = path.join(legacyDir, 'dist');
const publicDir = path.join(repoRoot, 'public');

function log(...args) { console.log(...args); }

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (e.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  if (!existsSync(legacyDir)) {
    console.error('Legacy directory not found at', legacyDir);
    process.exit(2);
  }

  const legacyPkg = path.join(legacyDir, 'package.json');
  if (existsSync(legacyPkg)) {
    log('Building legacy site in', legacyDir);
    execSync('npm --prefix "' + legacyDir + '" run build', { stdio: 'inherit' });
  } else {
    log('No package.json in', legacyDir, '- skipping build (assuming dist exists)');
  }

  if (!existsSync(legacyDist)) {
    console.error('Legacy dist not found at', legacyDist);
    process.exit(3);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(repoRoot, `.backup_migration_${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });

  for (const f of ['index.html', path.join('dist','index.html')]) {
    const target = path.join(publicDir, f);
    if (existsSync(target)) {
      const dest = path.join(backupDir, f.replace(/[\\/]/g, '_'));
      log('Backing up', target, '->', dest);
      await fs.copyFile(target, dest);
    }
  }

  const srcAssets = path.join(legacyDist, 'assets');
  const dstAssets = path.join(publicDir, 'assets');
  log('Copying assets from', srcAssets, '->', dstAssets);
  await copyDir(srcAssets, dstAssets);

  const srcIndex = path.join(legacyDist, 'index.html');
  const dstDistIndex = path.join(publicDir, 'dist', 'index.html');
  const dstRootIndex = path.join(publicDir, 'index.html');
  await fs.mkdir(path.dirname(dstDistIndex), { recursive: true });
  log('Copying', srcIndex, '->', dstDistIndex, 'and', dstRootIndex);
  await fs.copyFile(srcIndex, dstDistIndex);
  await fs.copyFile(srcIndex, dstRootIndex);

  log('Mirror complete. Backed up replaced files to', backupDir);
  log('Now you can run: node ./scripts/_tmp_static_server.js  # serves public/ on 127.0.0.1:3002');
}

main().catch(err => { console.error(err); process.exit(1); });
