/* Optional full browser suite: see README. Uses a loopback-only static server. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
const canonical = 'https://tm550120.github.io/mofuru-gym/index.html';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, bytes) => { if (error) { res.writeHead(404); return res.end(); } res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(bytes); });
});
(async () => {
  let browser;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    fs.mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(base); await page.locator('.game').last().waitFor();
    assert.equal(await page.locator('.game:visible').count(), 7);
    assert.equal(await page.locator('[data-game="mofuru-gym"]').getAttribute('href'), canonical);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'パズル', exact: true }).click();
    assert.equal(await page.locator('.game:visible').count(), 2);
    await page.getByLabel('ゲームを検索', { exact: true }).fill('CPU');
    assert.equal(await page.locator('.game:visible').count(), 1);
    await page.locator('[data-game="kadotori"]').click();
    await page.waitForURL('**/games/kadotori/'); await page.goBack();
    assert.equal(await page.locator('.game:visible').count(), 1);
    assert.equal(await page.getByLabel('ゲームを検索', { exact: true }).inputValue(), 'CPU');
    await page.getByLabel('ゲームを検索', { exact: true }).fill('no match');
    assert.equal(await page.locator('#empty-state').isVisible(), true);
    assert.equal(await page.locator('#surprise').isDisabled(), true);
    await page.getByRole('button', { name: '絞り込みをリセット' }).click();
    assert.equal(await page.locator('.game:visible').count(), 7);
    await page.getByRole('button', { name: /おまかせで選ぶ/ }).click();
    assert.equal(await page.locator('.game.picked').count(), 1);
    assert.equal(await page.locator('.game.picked').evaluate(el => el === document.activeElement), true);
    await page.goto(base + '/?q=%EF%BC%A4%EF%BC%A9%EF%BC%A3%EF%BC%A5');
    assert.equal(await page.locator('.game:visible').count(), 1);
    await page.goto(base + '/');
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `horizontal overflow at ${width}`);
      if (width === 390) await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    }
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.screenshot({ path: path.join(output, 'dark.png'), fullPage: true });
    assert.equal(await page.locator('.game').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    // Intercept canonical navigation: prove redirect behavior without relying on
    // external availability or joining a real game room during CI.
    await page.route('https://tm550120.github.io/mofuru-gym/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Canonical target</h1>' }));
    await page.goto(base + '/');
    await page.goto(base + '/games/mofuru-gym/?room=smoke#title');
    await page.waitForURL(canonical + '?room=smoke#title');
    await page.goBack(); assert.equal(page.url(), base + '/');
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJs.newPage(); await fallback.goto(base + '/');
    assert.equal(await fallback.locator('noscript a').count(), 7);
    await fallback.goto(base + '/games/mofuru-gym/');
    assert.equal(await fallback.locator('#canonical-game').getAttribute('href'), canonical);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: search, filters, reset, keyboard focus, history, responsive widths, dark/reduced-motion, legacy redirect, no-JS fallback. Screenshots in test-results/.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
