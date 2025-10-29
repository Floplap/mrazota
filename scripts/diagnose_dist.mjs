import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';

const OUT_DIR = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/+/, ''), '../ai_checks/screenshots');
async function ensureDir(dir){ try{ await fs.mkdir(dir, { recursive: true }); } catch(e){} }

async function run(){
  await ensureDir(OUT_DIR);
  // Prefer 3002 by default (our temporary static server) to avoid mismatches when Next runs on 3000
  const port = process.env.DIAG_PORT || process.env.PORT || '3002';
  // Allow overriding the full URL via DIAG_URL, otherwise default to root (serving rebuilt app at /)
  const url = process.env.DIAG_URL || `http://127.0.0.1:${port}/`;
  const viewportHeight = parseInt(process.env.VIEWPORT_HEIGHT || '916', 10);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: viewportHeight } });

  const diagnostics = {
    url,
    timestamp: new Date().toISOString(),
    console: [],
    pageErrors: [],
    requestFailed: [],
    requests: [],
    postMessages: [],
    rootInnerHTMLLength: null,
    htmlSnapshotPath: null
  };

  page.on('console', msg => {
    try { diagnostics.console.push({ type: msg.type(), text: msg.text() }); } catch(e){ diagnostics.console.push({ type:'console', text: String(msg) }); }
  });
  page.on('pageerror', err => diagnostics.pageErrors.push({ message: err.message, stack: err.stack }));
  page.on('requestfailed', req => diagnostics.requestFailed.push({ url: req.url(), failureText: req.failure()?.errorText || null, method: req.method() }));
  page.on('request', req => diagnostics.requests.push({ url: req.url(), method: req.method(), resourceType: req.resourceType() }));

  // Expose a function to get postMessage payloads pushed into window
  await page.exposeFunction('__capturePostMessage', payload => {
    diagnostics.postMessages.push({ when: new Date().toISOString(), payload });
  });

  // install a listener in the page to forward postMessage to our exposed function
  await page.addInitScript(() => {
    try {
      (window.__diagnostic_postMessage_listener_installed = (function(){
        function handler(ev){
          try{ window.__capturePostMessage?.( { data: ev.data, origin: ev.origin, sourceType: typeof ev.source } ); }catch(e){}
        }
        window.addEventListener('message', handler, false);
        return true;
      })());
    } catch(e) {}
  });

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    diagnostics.status = resp ? resp.status() : 'no-response';

    // wait a bit for client scripts
    await page.waitForTimeout(1200);

    // get HTML and save
    const html = await page.content();
    const htmlPath = path.join(OUT_DIR, 'dist-page.html');
    await fs.writeFile(htmlPath, html, 'utf8');
    diagnostics.htmlSnapshotPath = htmlPath;

    // capture root innerHTML length
    try {
      const len = await page.evaluate(() => {
        const el = document.querySelector('#root');
        return el ? el.innerHTML.length : null;
      });
      diagnostics.rootInnerHTMLLength = len;
    } catch(e){ diagnostics.rootInnerHTMLLength = `eval error: ${String(e)}`; }

    // capture screenshot (viewport and full)
    const fullPath = path.join(OUT_DIR, 'dist-full.png');
    await page.screenshot({ path: fullPath, fullPage: true });
    diagnostics.fullScreenshot = fullPath;
    const viewportPath = path.join(OUT_DIR, `dist-viewport-1280x${viewportHeight}.png`);
    await page.screenshot({ path: viewportPath, fullPage: false });
    diagnostics.viewportScreenshot = viewportPath;

    // give any late postMessages a moment
    await page.waitForTimeout(300);

  } catch (err) {
    diagnostics.gotoError = { message: err.message, stack: err.stack };
  } finally {
    await browser.close();
  }

  const outPath = path.join(OUT_DIR, 'dist-diagnostics.json');
  await fs.writeFile(outPath, JSON.stringify(diagnostics, null, 2), 'utf8');
  console.log('Wrote diagnostics to', outPath);
}

run().catch(err => { console.error(err); process.exit(1); });
