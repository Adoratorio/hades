// Optional real-browser checks. Set PLAYWRIGHT_MODULE to an installed Playwright
// module, BROWSER to chromium/firefox/webkit, and optionally BROWSER_CHANNEL.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const playwright = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browserType = process.env.BROWSER ?? 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(browserType));
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"@adoratorio/aion":"/node_modules/@adoratorio/aion/dist/index.js","@adoratorio/hermes":"/node_modules/@adoratorio/hermes/dist/index.js"}}</script><script type="module">import { run } from '/test/browserCheck.js'; try { window.result = await run(); } catch (error) { window.result = { error: error.stack }; }</script>`);
    return;
  }
  const file = resolve(root, `.${path}`);
  if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try {
    res.setHeader('Content-Type', extname(file) === '.js' ? 'text/javascript' : 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
let browser;
try {
  browser = await playwright[browserType].launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.result, { timeout: 30000 });
  const result = await page.evaluate(() => window.result);
  assert.ok(!result.error, result.error);
  console.log(JSON.stringify({ browser: browserType, version: browser.version(), ...result }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
