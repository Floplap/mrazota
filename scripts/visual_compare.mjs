import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// workspace root is parent of the project folder (we run this from mrazota-site)
const workspaceRoot = path.resolve(process.cwd(), '..');
const screenshotsDir = path.join(workspaceRoot, 'ai_checks', 'screenshots');
const baselineDir = path.join(workspaceRoot, 'ai_checks', 'baseline');
const actual = path.join(screenshotsDir, 'dist-full.png');
const baseline = path.join(baselineDir, 'dist-full.png');
const diffOut = path.join(screenshotsDir, 'dist-diff.png');

async function ensure(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) { }
}

function readPng(filePath) {
  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

async function run() {
  await ensure(screenshotsDir);
  await ensure(baselineDir);

  try {
    await fs.access(actual);
  } catch (e) {
    console.error('Actual screenshot not found at', actual);
    console.error('Run `node scripts/screenshot_dist.mjs` first to create it.');
    process.exit(2);
  }

  try {
    await fs.access(baseline);
  } catch (e) {
    // baseline missing — create it from actual
    await fs.copyFile(actual, baseline);
    console.log('Baseline did not exist — created baseline from current screenshot at', baseline);
    process.exit(0);
  }

  const img1 = await readPng(baseline);
  const img2 = await readPng(actual);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    console.warn('Image sizes differ. baseline:', img1.width + 'x' + img1.height, ', actual:', img2.width + 'x' + img2.height);
  }

  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  const out = new PNG({ width, height });
  const diffPixels = pixelmatch(img1.data, img2.data, out.data, width, height, { threshold: 0.1 });

  await new Promise((resolve, reject) => {
    out.pack().pipe(createWriteStream(diffOut)).on('finish', resolve).on('error', reject);
  });

  const total = width * height;
  const percent = (diffPixels / total) * 100;
  console.log(`Diff pixels: ${diffPixels} / ${total} (${percent.toFixed(6)}%)`);
  console.log('Diff image saved to', diffOut);
  // threshold (percent) from env or default
  const thresholdEnv = process.env.VISUAL_DIFF_THRESHOLD_PERCENT;
  const threshold = thresholdEnv ? Number(thresholdEnv) : 0.5; // percent
  let passed = percent <= threshold;
  // write a small markdown report into ai_checks/screenshots
  try {
    const reportDir = screenshotsDir;
    const reportPath = path.join(reportDir, 'visual-report.md');
    const lines = [];
    lines.push('# Visual comparison report');
    lines.push('');
    lines.push(`- baseline: ${baseline.replace(/\\/g, '/')} `);
    lines.push(`- actual:   ${actual.replace(/\\/g, '/')} `);
    lines.push(`- diff:     ${diffOut.replace(/\\/g, '/')} `);
    lines.push('');
    lines.push(`- diffPixels: ${diffPixels}`);
    lines.push(`- totalPixels: ${total}`);
    lines.push(`- percentDifferent: ${percent.toFixed(6)}%`);
    lines.push('');
    lines.push('> If percentDifferent is small (e.g. < 0.5), differences are likely minor.');

  // summary status
    lines.push('');
    lines.push(`- thresholdPercent: ${threshold}`);
    lines.push(`- passed: ${passed}`);

    await fs.writeFile(reportPath, lines.join('\n'), 'utf8');
    console.log('Wrote visual report to', reportPath);
  } catch (e) {
    console.warn('Failed to write visual report:', e.message || e);
  }

  if (!passed) {
    console.error(`Visual check failed: ${percent.toFixed(6)}% > threshold ${threshold}%`);
    process.exit(3);
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
