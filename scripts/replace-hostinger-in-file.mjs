import fs from 'fs';
import path from 'path';

const [,, target] = process.argv;
if (!target) {
  console.error('Usage: node replace-hostinger-in-file.mjs <file>');
  process.exit(2);
}

const URL = 'https://horizons-cdn.hostinger.com/9155bb54-3d58-4cf3-b221-1f5e9a43d962/889b01aad09ca057407f541bfab033e9.png';
const replacement = '/assets/legacy-logo.png';

try {
  const abs = path.resolve(target);
  const bak = abs + '.bak';
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(3);
  }
  // create backup
  fs.copyFileSync(abs, bak);
  let content = fs.readFileSync(abs, 'utf8');
  const occurrences = (content.match(new RegExp(URL.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
  if (occurrences === 0) {
    console.log('No occurrences found in', abs);
    process.exit(0);
  }
  content = content.split(URL).join(replacement);
  fs.writeFileSync(abs, content, 'utf8');
  console.log(`Replaced ${occurrences} occurrence(s) in ${abs}. Backup saved to ${bak}`);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
